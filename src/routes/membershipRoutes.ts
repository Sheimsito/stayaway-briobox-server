import { Router } from "express";
import { MembershipController } from "../controllers/membershipController.js";
import { MembershipService } from "../service/membershipService.js";

const router = Router();
const membershipController = new MembershipController(new MembershipService());


// Membership routes
router.post('/memberships', membershipController.createMembership);
router.put('/memberships/:id', membershipController.updateMembership);
router.get('/memberships', membershipController.getAllMemberships);
router.get('/memberships/active', membershipController.getActiveMemberships);
router.get('/memberships/cancelled', membershipController.getCancelledMemberships);


export default router;