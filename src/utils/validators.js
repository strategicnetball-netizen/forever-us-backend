export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

export const validateAge = (age) => {
  return age >= 18 && age <= 120;
};

export const validatePoints = (points) => {
  return Number.isInteger(points) && points > 0;
};
