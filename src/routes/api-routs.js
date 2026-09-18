// Schema definition for OpenAPI documentation

// Train schema definition
/**
 * @openapi
 * components:
 *   schemas:
 *     Train:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique train identifier
 *           example: series-e353
 *         name:
 *           type: string
 *           example: Series E353 Limited Express
 *         operator:
 *           type: string
 *           example: JR East
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         imageAlt:
 *           type: string
 *           nullable: true
 *         type:
 *           type: string
 *           example: Limited Express
 *         maxSpeedKmh:
 *           type: number
 *           example: 130
 *         capacity:
 *           type: number
 *           example: 360
 *         powerSource:
 *           type: string
 *           example: Electric
 *         bestFor:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - name
 *         - operator
 *         - type
 *         - maxSpeedKmh
 *         - capacity
 *         - powerSource
 */
