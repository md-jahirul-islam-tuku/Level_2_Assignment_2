import { Router } from "express";
import { login, refreshToken, signup } from "./auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

export const authRoute = router;
