import { clientDAO , findAllClients } from "../dao/clientDAO";
import { userDAO } from "../dao/userDAO";
import { Request, Response } from "express";
import config from "../config/config.js";
import bcrypt from "bcrypt";
import { UserRole } from "../types/database";


interface UserProfileRequest {
    userId: string;
}

/**
 * 
 */

const createUser = async (req: any, res: Response) => {
  try {
    const userId: string = req.user?.userId;
    const { email, name, password, role } = req.body;


    // Verify that the role is valid
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol inválido. Los roles permitidos son: empleado, admin y visitante."
      });
    }

    // Verify that the user does not exist
    const existingUser = await userDAO.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado."
      });
    }

    const userIsAdmin = await userDAO.findById(userId);
    if (!userIsAdmin) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado."
      });
    }

    if (userIsAdmin.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Usuario no autorizado."
      });
    }

    // Actually we have to think about this one <<---------------------------------->>
    if (role === UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Usuario no autorizado."
      });
    }

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userDAO.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    });

    res.status(201).json({
      success: true,
      user: user,
      message: "Usuario creado exitosamente."
    });

  } catch (err: unknown) {
    if (config.nodeEnv === "development") {
      console.error(err instanceof Error ? err.message : "Error interno del servidor");
    }
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.", err: err instanceof Error ? err.message : "Error interno del servidor"
    });
  }
}





/**
 * Retrieves the profile of the authenticated user.
 *
 * @async
 * @function getUserProfile
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
const getUserProfile = async (req: any, res: Response) => {
    try {
      const userId: string = req.user?.userId;
  
      const userProfile = await userDAO.findSafeProfileById(userId);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado."
        });
      }
  
      res.status(200).json({
        success: true,
        user: userProfile
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

/**
 * Updates the authenticated user's profile.
 *
 * @async
 * @function updateUserProfile
 * @param {Request} req - Request object con userId en req.user
 * @param {Response} res - Response object
 * @returns {Promise<void>} Returns a JSON object with:
 *  - 200: `{ success: true, user: updatedUser }` if updated successfully.
 *  - 400: `{ success: false, message: error.message }` if there are validation errors.
 *  - 404: `{ success: false, message: "Usuario no encontrado." }` if the user does not exist.
 *  - 500: `{ success: false, message: error.message }`if an internal error occurs.
 */
const updateUserProfile = async (req: any, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { name, email, role, currentPassword, newPassword } = req.body;
  
      // Verify that the user exists
      const existingUser = await userDAO.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado."
        });
      }

      if (existingUser.role !== UserRole.ADMIN && role === UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: "No puedes actualizar a un usuario a administrador sin serlo tú."
        });
      }
  
      // Check if the email already exists for another user
      if (email && email !== existingUser.email) {
        const emailExists = await userDAO.findByEmail(email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Este correo ya está registrado por otro usuario."
          });
        }
      }
  
      // Handle password change if provided
      if (currentPassword && newPassword) {
        // Verify current password
        const isCurrentPasswordValid: boolean = await bcrypt.compare(currentPassword, existingUser.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({
            success: false,
            message: "La contraseña actual es incorrecta."
          });
        }
        
        // Validate new password
        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: "La nueva contraseña debe tener al menos 6 caracteres."
          });
        }
  
        // Hash new password
        const saltRounds: number = 10;
        const hashedNewPassword: string = await bcrypt.hash(newPassword, saltRounds);
  
        // Update user with new password
        const updatedUser = await userDAO.updateById(userId, {
          name: name,
          email: email,
          role: role,
          password: hashedNewPassword
        });
        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado."
          });
        }
  
        // Get the updated profile (without sensitive data)
        const userProfile = await userDAO.findSafeProfileById(userId);
  
        return res.status(200).json({
          success: true,
          user: userProfile,
          message: "Perfil y contraseña actualizados exitosamente."
        });
      }
  
      // Update user without password change
      const updatedUser = await userDAO.updateById(userId, {
        name: name,
        email: email,
        role: role
      });
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado."
        });
      }
  
      // Get the updated profile (without sensitive data)
      const userProfile = await userDAO.findSafeProfileById(userId);
  
      res.status(200).json({
        success: true,
        user: userProfile,
        message: "Perfil actualizado exitosamente."
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


interface DeleteUserProfileRequest {
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
const softDeleteUserProfile = async (req: any, res: Response) => {
    try {
      const userId = req.user?.userId;
  
      // Soft delete the user account
      const deleted: boolean = await userDAO.softDeleteById(userId);
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
      console.error(err);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  };







/**
 * Create User 
 */

const createClient = async (req: Request, res: Response) => {
  try {
    const { first_name, middle_name, paternal_last_name, maternal_last_name, age, email, phone, address } = req.body;
    // Validate required fields
    if (!first_name || !middle_name || !paternal_last_name || !maternal_last_name || !age || !email || !phone || !address) {
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
    if (!phoneRule.test(phone)) {
      return res.status(400).json({ message: "El formato del número de teléfono no es válido" });
    }
    // Validate if user already exists
    const existingUserByEmail = await clientDAO.findByEmail(email);
    if (existingUserByEmail !== null) {
      return res.status(409).json({ message: "Este correo ya está registrado." });
    }
    // Validate if user already exists
    const existingUserByPhone = await clientDAO.findByPhoneNumber(phone);
    if (existingUserByPhone !== null) {
      return res.status(409).json({ message: "Este número de teléfono ya está registrado." });
    }
    // Create user in database if all validation passes
    const user = await clientDAO.create({
      first_name: first_name,
      middle_name: middle_name,
      paternal_last_name: paternal_last_name,
      maternal_last_name: maternal_last_name,
      age: age,
      email: email,
      phone: phone,
      address: address
    });
    res.status(201).json({ userId: user.id });

  } catch (error: unknown) {
    // If error is an instance of Error, return the message
    res.status(400).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
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
    const clientId: string = req.params.id;

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
      message: "Error interno del servidor.", err: err instanceof Error ? err.message : "Error interno del servidor"
    });
  }
};


/**
 * Retrieves all clients.
 *
 * @async
 * @function getAllClients
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} Returns a JSON response with:
 *  - 200: `{ success: true, users: clients, pagination: { total, page, limit, totalPages } }`
 * if retrieved successfully.
 *  - 500: `{ success: false, message: error.message }`
 * if an internal error occurs.
 */
const getAllClients = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { clients, total } = await findAllClients(page, limit);

    res.status(200).json({
      success: true,
      users: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: unknown) {
    if (config.nodeEnv === "development") {
      console.error(err instanceof Error ? err.message : "Error interno del servidor");
    }
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.", err: err instanceof Error ? err.message : "Error interno del servidor"
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
    const clientId = req.params.id;
    const { first_name, middle_name, paternal_last_name, maternal_last_name, age, email, phone, address } = req.body;

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

    if (phone && phone !== existingUser.phone) {
      const phoneExists = await clientDAO.findByPhoneNumber(phone);
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Este número de teléfono ya está registrado por otro usuario."
        });
      }
    }

    // Update client 
    const updatedUser = await clientDAO.updateById(clientId, {
      first_name: first_name,
      middle_name: middle_name,
      paternal_last_name: paternal_last_name,
      maternal_last_name: maternal_last_name,
      age: age,
      email: email,
      phone: phone,
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
      message: "Error interno del servidor.", err: err instanceof Error ? err.message : "Error interno del servidor"
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
    const clientId = req.params.id;

    // Verify that the user exists
    const existingUser = await clientDAO.findById(clientId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado."
      });
    }
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


export default { createClient, getAllClients, getClientProfile, updateClient, softDeleteAccount, softDeleteUserProfile, updateUserProfile, getUserProfile };