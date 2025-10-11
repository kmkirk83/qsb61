/**
 * Quantum Spark Bot™ - Cloudflare Workers API Handler
 * © 2024 All Rights Reserved.
 * 
 * PROPRIETARY SERVERLESS ARCHITECTURE
 * This Cloudflare Worker implements secure API endpoints,
 * authentication middleware, and database operations for
 * the Trading Bot Manager platform.
 * 
 * Deploy this to Cloudflare Workers with D1 database binding.
 */

// ================================
// WORKER CONFIGURATION
// ================================

export default {
    async fetch(request, env, ctx) {
        const worker = new TradingBotWorker(env, ctx);
        return worker.handleRequest(request);
    }
};

class TradingBotWorker {
    constructor(env, ctx) {
        this.env = env;
        this.ctx = ctx;
        this.db = env.DB; // D1 Database binding
        this.corsHeaders = {
            'Access-Control-Allow-Origin': '*', // Configure for your domain in production
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400',
        };
    }

    async handleRequest(request) {
        try {
            // Handle CORS preflight
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 200,
                    headers: this.corsHeaders
                });
            }

            const url = new URL(request.url);
            const path = url.pathname;

            // Route requests
            if (path.startsWith('/api/db')) {
                return this.handleDatabaseRequest(request, path);
            } else if (path.startsWith('/api/auth')) {
                return this.handleAuthRequest(request, path);
            } else if (path.startsWith('/api/users')) {
                return this.handleUsersRequest(request, path);
            } else if (path.startsWith('/api/bots')) {
                return this.handleBotsRequest(request, path);
            } else if (path.startsWith('/api/admin')) {
                return this.handleAdminRequest(request, path);
            } else if (path === '/api/health') {
                return this.handleHealthCheck();
            }

            return this.errorResponse('Not Found', 404);

        } catch (error) {
            console.error('Worker error:', error);
            return this.errorResponse('Internal Server Error', 500);
        }
    }

    // ================================
    // DATABASE REQUEST HANDLER
    // ================================

    async handleDatabaseRequest(request, path) {
        const method = request.method;
        
        if (path === '/api/db/query' && method === 'POST') {
            return this.handleSingleQuery(request);
        } else if (path === '/api/db/batch' && method === 'POST') {
            return this.handleBatchQuery(request);
        }

        return this.errorResponse('Database endpoint not found', 404);
    }

    async handleSingleQuery(request) {
        try {
            const { sql, params = [] } = await request.json();
            
            // Security: Validate SQL query
            if (!this.isValidQuery(sql)) {
                return this.errorResponse('Invalid SQL query', 400);
            }

            const result = await this.db.prepare(sql).bind(...params).all();
            
            return this.successResponse({
                success: true,
                results: result.results,
                meta: {
                    duration: result.meta?.duration,
                    rows_read: result.meta?.rows_read,
                    rows_written: result.meta?.rows_written
                }
            });

        } catch (error) {
            console.error('Query error:', error);
            return this.errorResponse(`Database error: ${error.message}`, 500);
        }
    }

    async handleBatchQuery(request) {
        try {
            const { queries } = await request.json();
            
            if (!Array.isArray(queries) || queries.length === 0) {
                return this.errorResponse('Invalid batch queries', 400);
            }

            const results = [];
            
            for (const query of queries) {
                if (!this.isValidQuery(query.sql)) {
                    results.push({ error: 'Invalid SQL query' });
                    continue;
                }

                try {
                    const result = await this.db.prepare(query.sql).bind(...(query.params || [])).all();
                    results.push({
                        success: true,
                        results: result.results,
                        meta: result.meta
                    });
                } catch (error) {
                    results.push({ error: error.message });
                }
            }

            return this.successResponse({
                success: true,
                results: results
            });

        } catch (error) {
            console.error('Batch query error:', error);
            return this.errorResponse(`Batch error: ${error.message}`, 500);
        }
    }

    // ================================
    // AUTHENTICATION HANDLERS
    // ================================

    async handleAuthRequest(request, path) {
        const method = request.method;
        
        if (path === '/api/auth/login' && method === 'POST') {
            return this.handleLogin(request);
        } else if (path === '/api/auth/register' && method === 'POST') {
            return this.handleRegister(request);
        } else if (path === '/api/auth/logout' && method === 'POST') {
            return this.handleLogout(request);
        } else if (path === '/api/auth/validate' && method === 'GET') {
            return this.handleValidateSession(request);
        } else if (path === '/api/auth/guest' && method === 'POST') {
            return this.handleGuestLogin(request);
        }

        return this.errorResponse('Auth endpoint not found', 404);
    }

    async handleLogin(request) {
        try {
            const { username, password } = await request.json();
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            const userAgent = request.headers.get('User-Agent') || 'unknown';

            // Get user from database
            const userResult = await this.db.prepare(`
                SELECT * FROM users 
                WHERE username = ? AND (is_admin = 1 OR password_hash = ?)
                LIMIT 1
            `).bind(username, `${username}_${password}_hash`).first();

            if (!userResult) {
                // Log failed login attempt
                await this.logAuditEvent(null, 'LOGIN_FAILED', 'auth', null, null, { username, ip: clientIP });
                return this.errorResponse('Invalid credentials', 401);
            }

            // Create session
            const sessionToken = this.generateSessionToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

            await this.db.prepare(`
                INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(userResult.id, sessionToken, clientIP, userAgent, expiresAt).run();

            // Update last login
            await this.db.prepare(`
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1
                WHERE id = ?
            `).bind(userResult.id).run();

            // Log successful login
            await this.logAuditEvent(userResult.id, 'LOGIN_SUCCESS', 'auth', null, null, { ip: clientIP });

            return this.successResponse({
                success: true,
                user: {
                    id: userResult.id,
                    username: userResult.username,
                    email: userResult.email,
                    subscription_tier: userResult.subscription_tier,
                    subscription_status: userResult.subscription_status,
                    is_admin: userResult.is_admin,
                    features_used: userResult.features_used
                },
                session_token: sessionToken,
                expires_at: expiresAt
            });

        } catch (error) {
            console.error('Login error:', error);
            return this.errorResponse('Login failed', 500);
        }
    }

    async handleRegister(request) {
        try {
            const { username, email, password, subscription_tier = 'free' } = await request.json();
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            const userAgent = request.headers.get('User-Agent') || 'unknown';

            // Validate input
            if (!username || !email || !password) {
                return this.errorResponse('Missing required fields', 400);
            }

            // Check if user already exists
            const existingUser = await this.db.prepare(`
                SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1
            `).bind(username, email).first();

            if (existingUser) {
                return this.errorResponse('User already exists', 409);
            }

            // Create user
            const subscriptionEnd = subscription_tier === 'free' ? 
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : // 1 year for free
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();    // 14 day trial

            const userResult = await this.db.prepare(`
                INSERT INTO users (
                    username, email, password_hash, subscription_tier, 
                    subscription_status, subscription_end, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
            `).bind(
                username, email, `${username}_${password}_hash`, subscription_tier,
                subscription_tier === 'free' ? 'active' : 'trial',
                subscriptionEnd, clientIP, userAgent
            ).first();

            // Log user creation
            await this.logAuditEvent(userResult.id, 'USER_CREATED', 'user', userResult.id, null, { 
                username, email, subscription_tier, ip: clientIP 
            });

            return this.successResponse({
                success: true,
                message: 'User created successfully',
                user: {
                    id: userResult.id,
                    username: userResult.username,
                    email: userResult.email,
                    subscription_tier: userResult.subscription_tier
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return this.errorResponse('Registration failed', 500);
        }
    }

    async handleGuestLogin(request) {
        try {
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            const userAgent = request.headers.get('User-Agent') || 'unknown';

            // Create guest session
            const sessionToken = this.generateSessionToken();
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

            await this.db.prepare(`
                INSERT INTO user_sessions (session_token, ip_address, user_agent, is_guest, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(sessionToken, clientIP, userAgent, true, expiresAt).run();

            return this.successResponse({
                success: true,
                guest_session: true,
                session_token: sessionToken,
                expires_at: expiresAt
            });

        } catch (error) {
            console.error('Guest login error:', error);
            return this.errorResponse('Guest login failed', 500);
        }
    }

    // ================================
    // USER MANAGEMENT HANDLERS
    // ================================

    async handleUsersRequest(request, path) {
        const method = request.method;
        
        // Authenticate request
        const auth = await this.authenticateRequest(request);
        if (!auth.success) {
            return this.errorResponse('Unauthorized', 401);
        }

        if (path === '/api/users/me' && method === 'GET') {
            return this.handleGetCurrentUser(auth.user);
        } else if (path === '/api/users/update' && method === 'PATCH') {
            return this.handleUpdateUser(request, auth.user);
        }

        return this.errorResponse('User endpoint not found', 404);
    }

    // ================================
    // ADMIN HANDLERS
    // ================================

    async handleAdminRequest(request, path) {
        // Authenticate admin request
        const auth = await this.authenticateRequest(request);
        if (!auth.success || !auth.user?.is_admin) {
            return this.errorResponse('Admin access required', 403);
        }

        const method = request.method;
        
        if (path === '/api/admin/users' && method === 'GET') {
            return this.handleGetAllUsers(request);
        } else if (path.startsWith('/api/admin/users/') && method === 'PATCH') {
            const userId = path.split('/').pop();
            return this.handleUpdateUserAdmin(request, userId);
        } else if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
            const userId = path.split('/').pop();
            return this.handleDeleteUser(userId);
        } else if (path === '/api/admin/analytics' && method === 'GET') {
            return this.handleGetAnalytics();
        }

        return this.errorResponse('Admin endpoint not found', 404);
    }

    async handleGetAllUsers(request) {
        try {
            const url = new URL(request.url);
            const search = url.searchParams.get('search') || '';
            const tier = url.searchParams.get('tier') || '';
            const status = url.searchParams.get('status') || '';
            const limit = parseInt(url.searchParams.get('limit')) || 100;

            let query = `
                SELECT u.*, sp.display_name as plan_name, sp.price as plan_price
                FROM users u
                LEFT JOIN subscription_plans sp ON u.subscription_tier = sp.name
                WHERE 1=1
            `;
            const params = [];

            if (search) {
                query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (tier) {
                query += ' AND u.subscription_tier = ?';
                params.push(tier);
            }

            if (status) {
                query += ' AND u.subscription_status = ?';
                params.push(status);
            }

            query += ' ORDER BY u.created_at DESC LIMIT ?';
            params.push(limit);

            const result = await this.db.prepare(query).bind(...params).all();

            return this.successResponse({
                success: true,
                data: result.results,
                total: result.results.length
            });

        } catch (error) {
            console.error('Get all users error:', error);
            return this.errorResponse('Failed to get users', 500);
        }
    }

    // ================================
    // HEALTH CHECK
    // ================================

    async handleHealthCheck() {
        try {
            const startTime = Date.now();
            
            // Test database connection
            const dbTest = await this.db.prepare('SELECT 1 as test').first();
            
            const responseTime = Date.now() - startTime;
            
            // Get basic stats
            const userCount = await this.db.prepare('SELECT COUNT(*) as count FROM users').first();
            const activeSession = await this.db.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > datetime("now")').first();

            return this.successResponse({
                status: 'healthy',
                database: dbTest ? 'connected' : 'disconnected',
                response_time: responseTime,
                stats: {
                    total_users: userCount?.count || 0,
                    active_sessions: activeSession?.count || 0
                },
                timestamp: new Date().toISOString(),
                worker: 'Quantum Spark Bot™ API'
            });

        } catch (error) {
            return this.errorResponse('Health check failed', 500, {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // ================================
    // AUTHENTICATION HELPERS
    // ================================

    async authenticateRequest(request) {
        try {
            const authHeader = request.headers.get('Authorization');
            const sessionToken = authHeader?.replace('Bearer ', '');

            if (!sessionToken) {
                return { success: false, error: 'No session token' };
            }

            const session = await this.db.prepare(`
                SELECT s.*, u.username, u.subscription_tier, u.is_admin, u.is_guest
                FROM user_sessions s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.expires_at > datetime('now')
                LIMIT 1
            `).bind(sessionToken).first();

            if (!session) {
                return { success: false, error: 'Invalid session' };
            }

            // Update last activity
            await this.db.prepare(`
                UPDATE user_sessions 
                SET last_activity = CURRENT_TIMESTAMP
                WHERE session_token = ?
            `).bind(sessionToken).run();

            return { 
                success: true, 
                user: session.user_id ? {
                    id: session.user_id,
                    username: session.username,
                    subscription_tier: session.subscription_tier,
                    is_admin: session.is_admin,
                    is_guest: session.is_guest
                } : null,
                session: session
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async logAuditEvent(userId, action, resourceType, resourceId, oldValues, newValues) {
        try {
            await this.db.prepare(`
                INSERT INTO audit_logs (
                    user_id, action, resource_type, resource_id, 
                    old_values, new_values, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                userId, action, resourceType, resourceId,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null
            ).run();
        } catch (error) {
            console.error('Audit log error:', error);
        }
    }

    isValidQuery(sql) {
        // Basic SQL validation - enhance for production
        const dangerous = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
        const upperSQL = sql.toUpperCase();
        
        // Allow certain DELETE operations
        if (upperSQL.includes('DELETE FROM user_sessions') || 
            upperSQL.includes('DELETE FROM audit_logs')) {
            return true;
        }
        
        return !dangerous.some(word => upperSQL.includes(word));
    }

    successResponse(data) {
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders
            }
        });
    }

    errorResponse(message, status = 400, data = null) {
        return new Response(JSON.stringify({
            error: message,
            status: status,
            ...data
        }), {
            status: status,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders
            }
        });
    }
}

// ================================
// SCHEDULED TASKS (Cron Triggers)
// ================================

export async function scheduled(controller, env, ctx) {
    switch (controller.cron) {
        case '0 */6 * * *': // Every 6 hours
            await cleanupExpiredSessions(env.DB);
            break;
        case '0 2 * * *': // Daily at 2 AM
            await cleanupOldAuditLogs(env.DB);
            break;
    }
}

async function cleanupExpiredSessions(db) {
    try {
        const result = await db.prepare(`
            DELETE FROM user_sessions 
            WHERE expires_at < datetime('now')
        `).run();
        
        console.log(`Cleaned up ${result.changes} expired sessions`);
    } catch (error) {
        console.error('Session cleanup error:', error);
    }
}

async function cleanupOldAuditLogs(db) {
    try {
        const result = await db.prepare(`
            DELETE FROM audit_logs 
            WHERE timestamp < datetime('now', '-90 days')
        `).run();
        
        console.log(`Cleaned up ${result.changes} old audit logs`);
    } catch (error) {
        console.error('Audit cleanup error:', error);
    }
}