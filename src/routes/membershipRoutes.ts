import { Router } from "express";
import MembershipController from "../controllers/membershipController.js";
import { MembershipService } from "../service/membershipService.js";

const router = Router();
const membershipController = new MembershipController(new MembershipService());


// Membership routes
router.post('/memberships', membershipController.createMembership.bind(membershipController));
router.put('/memberships/:id', membershipController.updateMembership.bind(membershipController));
router.get('/memberships', membershipController.getAllMemberships.bind(membershipController));
router.get('/memberships/active', membershipController.getActiveMemberships.bind(membershipController));
router.get('/memberships/pending', membershipController.getPendingMemberships.bind(membershipController));
router.get('/memberships/:id', membershipController.getMembershipById.bind(membershipController));


export default router;