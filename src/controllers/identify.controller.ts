import { Request, Response, NextFunction } from "express";
import { IdentifyService } from "../services/identify.service";
export const IdentifyController = async (
    req:Request, 
    res:Response,
    next:NextFunction
) => {
    try {
        const { email, phoneNumber } = req.body; 
        
        if(!email && !phoneNumber) {
            return res.status(400).json({ 
                message: 'Either email or phoneNumber must be provided',
            });
        }
        const result = await IdentifyService({ 
            email, 
            phoneNumber,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in IdentifyController:', error);
        next(error);
    }
};
