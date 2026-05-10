import { clientDAO } from "../dao/clientDAO";
import { Request, Response } from "express";
import config from "../config/config.js";
import bcrypt from "bcrypt";


interface UserProfileRequest {
    userId: string;
}


/**
 * Create User 
 */

const createClient = async(req: Request, res: Response) => {
  try{
    const { name, lastName, age, email, phoneNumber, address } = req.body;
    // Validate required fields
    if (!name || !lastName || !age || !email || !phoneNumber || !address) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }
    // Validate age
    else if (age < 13) {
      return res.status(400).json({ message: "La edad debe ser mayor o igual a 13 años." });
    }
    // Validate email format
    const emailRule: RegExp = /^\S+@\S+\.\S+$/;
    if (!emailRule.test(email)) {
      return res.status(400).json({ message: "El formato de la dirección de correo electrónico no es válido" });
    }
    // Validate phone number format
    const phoneRule: RegExp = /^[0-9]{10}$/;
    if (!phoneRule.test(phoneNumber)) {
      return res.status(400).json({ message: "El formato del número de teléfono no es válido" });
    }
    // Validate if user already exists
    const existingUserByEmail = await clientDAO.findByEmail(email);
    if (existingUserByEmail !== null) {
      return res.status(409).json({ message: "Este correo ya está registrado." });
    }
    // Validate if user already exists
    const existingUserByPhone = await clientDAO.findByPhoneNumber(phoneNumber);
    if (existingUserByPhone !== null) {
      return res.status(409).json({ message: "Este número de teléfono ya está registrado." });
    }
    // Create user in database if all validation passes
    const user = await clientDAO.create({ name, lastName, age, email, phoneNumber, address });
    res.status(201).json({ userId: user.id });

    } catch (error: unknown) {
      // If error is an instance of Error, return the message
      res.status(400).json({ message: error instanceof Error ? error.message : "Error interno del servidor"});
    }
}

/**
 * Retrieves the profile of the authenticated client.
 *
 * @async
 * @function getClientProfile
 * @param {Request} req - Express request object containing `userId` in `req.user`.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with:
 *  - 200: `{ success: true, user: userProfile }`
 * if retrieved successfully.
 *  - 404: `{ success: false, message: "User not found." }`
 * if the user does not exist.
 *  - 500: `{ success: false, message: error.message }`
 * if an internal error occurs.
 */
const getClientProfile = async (req: any, res: Response) => {
    try {
      const clientId: string = req.user?.userId;
  
        const clientProfile = await clientDAO.findById(clientId);
  
      if (!clientProfile) {
        return res.status(404).json({
          success: false,
          message: "Cliente no encontrado."
        });
      }
  
      res.status(200).json({
        success: true,
        user: clientProfile
      });
    } catch (err: unknown) {
      if (config.nodeEnv === "development") {
        console.error(err instanceof Error ? err.message : "Error interno del servidor");
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor." , err: err instanceof Error ? err.message : "Error interno del servidor"
      });
    }
  };

interface UpdateClient {
    clientId: string;
    name: string;
    lastName: string;
    age: number;
    email: string;
    phoneNumber: string;
    address: string;
}

/**
 * Updates the authenticated client's profile.
 *
 * @async
 * @function updateClient
 * @param {Request} req - Request object con userId en req.user
 * @param {Response} res - Response object
 * @returns {Promise<void>} Returns a JSON object with:
 *  - 200: `{ success: true, user: updatedUser }` if updated successfully.
 *  - 400: `{ success: false, message: error.message }` if there are validation errors.
 *  - 404: `{ success: false, message: "Usuario no encontrado." }` if the user does not exist.
 *  - 500: `{ success: false, message: error.message }`if an internal error occurs.
 */
const updateClient = async (req: any, res: Response) => {
    try {
      const clientId = req.user?.userId;
      const { name, lastName, age, email, phoneNumber, address } = req.body;
  
      // Verify that the user exists
      const existingUser = await clientDAO.findById(clientId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Cliente no encontrado."
        });
      }
  
      // Check if the email already exists for another user
      if (email && email !== existingUser.email) {
        const emailExists = await clientDAO.findByEmail(email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Este correo ya está registrado por otro usuario."
          });
        }
      }
  
      // Update client 
      const updatedUser = await clientDAO.updateById(clientId, {
        name: name,
        lastName: lastName,
        age: age,
        email: email,
        phoneNumber: phoneNumber,
        address: address
      });
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Cliente no encontrado."
        });
      }
  
      // Get the updated profile (without sensitive data)
      const userProfile = await clientDAO.findById(clientId);
  
      res.status(200).json({
        success: true,
        user: userProfile,
        message: "Usuario actualizado exitosamente."
      });
    } catch (err: unknown) {
      if (config.nodeEnv === "development") {
        console.error(err instanceof Error ? err.message : "Error interno del servidor");
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor." , err: err instanceof Error ? err.message : "Error interno del servidor"
      });
    }
    
  };




interface DeleteClientRequest {
    userId: string;
}

/**
 * Boolean deletes the auth user account
 * @async
 * @function deleteAccount
 * @param {Request} req - Express request object containing `userId` in `req.user`.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON object with:
 *  - 200: `{ success: true, message: "Cuenta eliminada." }` if the account was deleted successfully.
 *  - 404: `{ success: false, message: "Usuario no encontrado o ya eliminado." }` if the user does not exist or is already deleted.
 *  - 500: `{ success: false, message: "Error interno del servidor." }` if an internal error occurs.
 */
const softDeleteAccount = async (req: any, res: Response) => {
    try {
      const clientId = req.user?.userId;
  

      // Soft delete the user account
      const deleted: boolean = await clientDAO.softDeleteById(clientId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado o ya eliminado." });
      }
  
      const isProduction: boolean = config.nodeEnv === 'production';
      res.clearCookie("access_token", {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      
  
      return res.status(200).json({ success: true, message: "Cuenta eliminada." });
    } catch (err: unknown) {
      if (config.nodeEnv === "development") {
        console.error(err);
      }
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  };


export default { createClient, getClientProfile, updateClient, softDeleteAccount };