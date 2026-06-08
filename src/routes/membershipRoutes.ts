import { Router } from "express";
import MembershipController from "../controllers/membershipController.js";
import { MembershipService } from "../service/membershipService.js";
import MembershipPlanController from "../controllers/membershipPlanController.js";
import { MembershipPlanService } from "../service/membershipPlanService.js";
import MembershipFreezeController from "../controllers/membershipFreezeController.js";
import { MembershipFreezeService } from "../service/membershipFreezeService.js";
import { authenticateToken, requirePermission } from "../middleware/auth.js";

const router = Router();
const membershipController = new MembershipController(new MembershipService());
const membershipPlanController = new MembershipPlanController(new MembershipPlanService());
const membershipFreezeController = new MembershipFreezeController(new MembershipFreezeService());

router.use(authenticateToken);

router.post('/customers', requirePermission('memberships.create'), membershipController.createMembership.bind(membershipController));
router.put('/customers/:id', requirePermission('memberships.manage'), membershipController.updateMembership.bind(membershipController));
router.put('/customers/cancel/:id', requirePermission('memberships.manage'), membershipController.cancelMembership.bind(membershipController));
router.get('/customers', membershipController.getAllMemberships.bind(membershipController));
router.get('/customers/active', membershipController.getActiveMemberships.bind(membershipController));
router.get('/customers/pending', membershipController.getPendingMemberships.bind(membershipController));
router.get('/customers/:id', membershipController.getMembershipById.bind(membershipController));

router.post('/plans', requirePermission('memberships.manage'), membershipPlanController.createPlan.bind(membershipPlanController));
router.put('/plans/:id', requirePermission('memberships.manage'), membershipPlanController.updatePlan.bind(membershipPlanController));
router.get('/plans/active', membershipPlanController.getActivePlans.bind(membershipPlanController));
router.get('/plans/disabled', membershipPlanController.getDisabledPlans.bind(membershipPlanController));
router.get('/plans/:id', membershipPlanController.getPlanById.bind(membershipPlanController));
router.put('/plans/activate/:id', requirePermission('memberships.manage'), membershipPlanController.activatePlan.bind(membershipPlanController));
router.put('/plans/deactivate/:id', requirePermission('memberships.manage'), membershipPlanController.deactivatePlan.bind(membershipPlanController));

router.post('/freezes/:membershipId', requirePermission('memberships.manage'), membershipFreezeController.createFreeze.bind(membershipFreezeController));
router.get('/freezes/:membershipId', membershipFreezeController.getFreezesByMembershipId.bind(membershipFreezeController));
router.put('/freezes/:freezeId', requirePermission('memberships.manage'), membershipFreezeController.updateFreeze.bind(membershipFreezeController));
router.put('/freeze/cancel/:freezeId', requirePermission('memberships.manage'), membershipFreezeController.cancelFreeze.bind(membershipFreezeController));
router.put('/freeze/activate/:freezeId', requirePermission('memberships.manage'), membershipFreezeController.activateFreeze.bind(membershipFreezeController));

export default router;