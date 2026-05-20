import { Router } from "express";
import MembershipController from "../controllers/membershipController.js";
import { MembershipService } from "../service/membershipService.js";
import MembershipPlanController from "../controllers/membershipPlanController.js";
import { MembershipPlanService } from "../service/membershipPlanService.js";
import MembershipFreezeController from "../controllers/membershipFreezeController.js";
import { MembershipFreezeService } from "../service/membershipFreezeService.js";

const router = Router();
const membershipController = new MembershipController(new MembershipService());
const membershipPlanController = new MembershipPlanController(new MembershipPlanService());
const membershipFreezeController = new MembershipFreezeController(new MembershipFreezeService());

// Client Membership routes
router.post('/customers', membershipController.createMembership.bind(membershipController));
router.put('/customers/:id', membershipController.updateMembership.bind(membershipController));
router.get('/customers', membershipController.getAllMemberships.bind(membershipController));
router.get('/customers/active', membershipController.getActiveMemberships.bind(membershipController));
router.get('/customers/pending', membershipController.getPendingMemberships.bind(membershipController));
router.get('/customers/:id', membershipController.getMembershipById.bind(membershipController));

// Membership Plan routes
router.post('/plans', membershipPlanController.createPlan.bind(membershipPlanController));
router.put('/plans/:id', membershipPlanController.updatePlan.bind(membershipPlanController));
router.get('/plans/active', membershipPlanController.getActivePlans.bind(membershipPlanController));
router.get('/plans/disabled', membershipPlanController.getDisabledPlans.bind(membershipPlanController));
router.get('/plans/:id', membershipPlanController.getPlanById.bind(membershipPlanController));
router.put('/plans/:id/activate', membershipPlanController.activatePlan.bind(membershipPlanController));
router.put('/plans/:id/deactivate', membershipPlanController.deactivatePlan.bind(membershipPlanController));

// Membership Freeze routes
router.post('/:membershipId/freeze', membershipFreezeController.createFreeze.bind(membershipFreezeController));
router.get('/:membershipId/freezes', membershipFreezeController.getFreezesByMembershipId.bind(membershipFreezeController));
router.put('/freeze/:freezeId', membershipFreezeController.updateFreeze.bind(membershipFreezeController));
router.put('/freeze/:freezeId/cancel', membershipFreezeController.cancelFreeze.bind(membershipFreezeController));
router.put('/freeze/:freezeId/activate', membershipFreezeController.activateFreeze.bind(membershipFreezeController));

export default router;
