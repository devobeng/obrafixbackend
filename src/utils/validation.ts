import mongoose from "mongoose";

export const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Ghana phone number format: +233XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+233|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}; 