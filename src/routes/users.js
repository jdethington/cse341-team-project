import { Router } from "express";
import { userAdminPage} from "../controllers/users.js";
import { requirePageLogin } from "../middleware/auth.js";

const router = Router();

// Page routes (EJS responses for the browser)
router.get("/users/admin", requirePageLogin, userAdminPage);

export default router;