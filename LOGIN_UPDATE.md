# Login Update - Email or Phone Number Support

## Overview

Updated the authentication system to allow users, providers, and admins to login using either their email address or phone number.

## Backend Changes

### 1. Updated Login Validation Schema

- **File**: `backend/src/validators/userValidator.ts`
- **Change**: Modified `userLoginSchema` to accept `emailOrPhone` instead of `email`
- **New Schema**:
  ```typescript
  export const userLoginSchema = z.object({
    emailOrPhone: z.string().min(1, "Email or phone number is required"),
    password: z.string().min(1, "Password is required"),
  });
  ```

### 2. Enhanced User Model

- **File**: `backend/src/models/User.ts`
- **Added Methods**:
  - `findByPhone(phone: string)` - Find user by phone number
  - `findByEmailOrPhone(emailOrPhone: string)` - Smart method that detects if input is email or phone

### 3. Updated AuthService

- **File**: `backend/src/services/AuthService.ts`
- **Change**: Modified `authenticateUser` method to accept `emailOrPhone` parameter
- **Logic**: Uses `User.findByEmailOrPhone()` to automatically detect email vs phone

### 4. Updated AuthController

- **File**: `backend/src/controllers/authController.ts`
- **Change**: Updated login endpoint to use `validatedData.emailOrPhone`
- **Error Message**: Updated to "Invalid email/phone or password"

## Frontend Changes

### 1. New Unified Login Schema

- **File**: `obrafix/validations/authSchemas.ts`
- **Added**: `loginSchema` for unified email/phone login
- **Type**: `LoginFormData` type export

### 2. Updated API Interface

- **File**: `obrafix/services/api.ts`
- **Change**: Updated `LoginRequest` interface to use `emailOrPhone: string`

## How It Works

### Backend Logic

1. User submits login with `emailOrPhone` and `password`
2. Backend validates the input using `userLoginSchema`
3. `User.findByEmailOrPhone()` method:
   - Checks if input contains "@" (email)
   - If email: searches by email field
   - If phone: searches by phone field
4. Authenticates user with found credentials

### Frontend Usage

```typescript
// Both of these will work:
const loginData1 = {
  emailOrPhone: "user@example.com",
  password: "password123",
};

const loginData2 = {
  emailOrPhone: "0242389831",
  password: "password123",
};
```

## API Endpoint

- **URL**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "emailOrPhone": "user@example.com" | "0242389831",
    "password": "password123"
  }
  ```

## Benefits

- ✅ **Flexible Login**: Users can login with either email or phone
- ✅ **Backward Compatible**: Existing email logins still work
- ✅ **Smart Detection**: Automatically detects email vs phone format
- ✅ **All User Types**: Works for users, providers, and admins
- ✅ **Consistent API**: Single endpoint handles both login methods

## Testing

Test the login functionality with:

1. **Email Login**: Use registered email address
2. **Phone Login**: Use registered phone number (with or without country code)
3. **Invalid Input**: Test with non-existent email/phone
4. **Wrong Password**: Test with correct email/phone but wrong password
