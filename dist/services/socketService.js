import { Server } from 'socket.io';
let io = null;
let prismaInstance = null;
const activeUsers = new Map(); // userId -> socket.id
const activeCalls = new Map(); // callId -> { caller, callee, state }
// Helper to check if user can receive calls
async function canReceiveCall(userId) {
    try {
        if (!prismaInstance) {
            console.error('Prisma not initialized');
            return false;
        }
        const user = await prismaInstance.user.findUnique({
            where: { id: userId },
            select: { tier: true }
        });
        // Only premium and vip can receive calls
        return user && (user.tier === 'premium' || user.tier === 'vip');
    }
    catch (err) {
        console.error('Error checking call permissions:', err);
        return false;
    }
}
export function initializeSocket(httpServer, prisma) {
    prismaInstance = prisma;
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        // User registers with their ID
        socket.on('user:register', (userId) => {
            activeUsers.set(userId, socket.id);
            socket.userId = userId;
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });
        // Initiate call
        socket.on('call:initiate', async ({ callerId, calleeId, offer }) => {
            try {
                // Check if callee can receive calls
                const canReceive = await canReceiveCall(calleeId);
                if (!canReceive) {
                    socket.emit('call:failed', { reason: 'Recipient cannot receive calls' });
                    return;
                }
                const calleeSocketId = activeUsers.get(calleeId);
                if (calleeSocketId) {
                    const callId = `${callerId}-${calleeId}-${Date.now()}`;
                    activeCalls.set(callId, { caller: callerId, callee: calleeId, state: 'ringing' });
                    io.to(calleeSocketId).emit('call:incoming', {
                        callId,
                        callerId,
                        callerName: socket.callerName || 'Someone',
                        offer
                    });
                    console.log(`Call initiated from ${callerId} to ${calleeId}`);
                }
                else {
                    socket.emit('call:failed', { reason: 'User offline' });
                }
            }
            catch (err) {
                console.error('Error initiating call:', err);
                socket.emit('call:failed', { reason: 'Error initiating call' });
            }
        });
        // Answer call
        socket.on('call:answer', ({ callId, calleeId, answer }) => {
            const call = activeCalls.get(callId);
            if (call) {
                const callerSocketId = activeUsers.get(call.caller);
                if (callerSocketId) {
                    activeCalls.set(callId, { ...call, state: 'active' });
                    io.to(callerSocketId).emit('call:answered', {
                        callId,
                        answer
                    });
                    console.log(`Call ${callId} answered`);
                }
            }
        });
        // Reject call
        socket.on('call:reject', ({ callId }) => {
            const call = activeCalls.get(callId);
            if (call) {
                const callerSocketId = activeUsers.get(call.caller);
                if (callerSocketId) {
                    io.to(callerSocketId).emit('call:rejected', { callId });
                    activeCalls.delete(callId);
                    console.log(`Call ${callId} rejected`);
                }
            }
        });
        // ICE candidate exchange
        socket.on('ice:candidate', ({ callId, candidate, to }) => {
            const targetSocketId = activeUsers.get(to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('ice:candidate', {
                    callId,
                    candidate
                });
            }
        });
        // End call
        socket.on('call:end', ({ callId }) => {
            const call = activeCalls.get(callId);
            if (call) {
                const otherUserId = call.caller === socket.userId ? call.callee : call.caller;
                const otherSocketId = activeUsers.get(otherUserId);
                if (otherSocketId) {
                    io.to(otherSocketId).emit('call:ended', { callId });
                }
                activeCalls.delete(callId);
                console.log(`Call ${callId} ended`);
            }
        });
        // Disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                activeUsers.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected`);
            }
        });
    });
    return io;
}
export function getIO() {
    return io;
}
export function getActiveUsers() {
    return activeUsers;
}
