import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
    userId: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'missing authorization header' })
        return
    }

    try {
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string }
        ;(req as AuthenticatedRequest).userId = payload.sub
        next()
    } catch {
        res.status(401).json({ error: 'invalid token' })
    }
}
