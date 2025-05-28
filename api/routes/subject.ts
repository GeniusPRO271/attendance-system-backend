import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm"; // Import eq for comparisons

// Import services, schemas, builders, and database connection
import { SubjectServiceClass, type SubjectService } from "../service/subject";
import { createSubjectSchema } from "../zod/create_schema";
import {
  insertSubjectSchema,
  insertSubjectToGroupSchema,
  subjectsToGroupsTable,
  SubjectTable,
} from "../db/schema/tables";
import { SubjectBuilder } from "../builders";
import { subjectFilterSchema, validateUUID } from "../zod/select_schema"; // Assuming validGroupParams is not used here
import { updateSubjectSchema } from "../zod/update_schema";
import { db } from "../db"; // Assuming this is your configured drizzle instance

/**
 * Initializes and configures the Hono router for subject-related endpoints.
 *
 * @param {SubjectService} service - The service class instance for subject operations.
 * @param {PostgresJsDatabase<Record<string, never>>} dbInstance - The Drizzle database instance.
 * @returns {Hono} - The configured Hono router instance.
 */
function startSubjectRoute(
  service: SubjectService,
  dbInstance: PostgresJsDatabase<Record<string, never>>
): Hono {
  const api = new Hono();

  // --- POST / ---
  // Creates a new subject and optionally associates it with groups.
  api.post(
    "/",
    zValidator("json", createSubjectSchema), // Validate request body
    async (c) => {
      try {
        const body = c.req.valid("json");

        // 1. Build and validate the new subject data
        const newSubjectData = new SubjectBuilder(body);
        const validatedSubject = insertSubjectSchema.parse(newSubjectData); // Ensures data matches the insert schema

        // 2. Insert the new subject into the database
        // Drizzle returns an array, we expect one result here
        const insertedSubjectResult = await dbInstance
          .insert(SubjectTable)
          .values(validatedSubject)
          .returning(); // Use returning() to get the inserted data

        if (!insertedSubjectResult || insertedSubjectResult.length === 0) {
          console.error("Failed to insert subject, no data returned.");
          c.status(500);
          return c.json({ message: "Failed to create subject", error: "Database insertion failed" });
        }

        const createdSubject = insertedSubjectResult[0]; // Get the actual inserted subject

        // 3. Handle group associations (if group_ids are provided)
        if (body.group_ids && body.group_ids.length > 0) {
          const relationsToInsert = body.group_ids.map((groupId) => {
            const relationData = {
              subject_id: createdSubject.id, // Use the ID from the actually inserted subject
              group_id: groupId,
            };
            // Validate each relation before adding to the batch
            return insertSubjectToGroupSchema.parse(relationData);
          });

          // Insert all relations in a single batch operation for efficiency
          if (relationsToInsert.length > 0) {
            await dbInstance
              .insert(subjectsToGroupsTable)
              .values(relationsToInsert);
          }
        }

        // 4. Return success response
        c.status(201); // Use 201 Created status code
        return c.json({
          message: "New subject added successfully",
          data: createdSubject, // Return the subject data as inserted
        });

      } catch (error: any) {
        console.error("Error creating subject:", error);
        c.status(500); // Internal Server Error
        return c.json({
          message: "Failed to create subject",
          error: error.message || "An unexpected error occurred",
        });
      }
    }
  );

  // --- GET /all ---
  // Retrieves all subjects from the database.
  api.get("/all", zValidator("query", subjectFilterSchema), async (c) => {
    try {
      const filters = c.req.valid("query")
      const subjectsData = await service.getAllFromQuery(filters)
      console.log("subjectsData", subjectsData)
      return c.json({
        message: "All subjects retrieved successfully",
        data: subjectsData,
      });
    } catch (error: any) {
      console.error("Error fetching all subjects:", error);
      c.status(500);
      return c.json({
        message: "Failed to retrieve subjects",
        error: error.message || "An unexpected error occurred",
      });
    }
  });

  // --- GET /:uuid ---
  // Retrieves a specific subject by its UUID.
  api.get(
    "/:uuid",
    zValidator("param", validateUUID), // Validate UUID in path parameter
    async (c) => {
      try {
        const { uuid: subjectId } = c.req.valid("param");
        // Use the service layer to fetch the subject
        const subject = await service.getSpecificFromUUID(subjectId);

        if (!subject) {
          c.status(404); // Not Found
          return c.json({ message: "Subject not found" });
        }

        return c.json({
          message: "Specific subject data retrieved successfully",
          data: subject,
        });
      } catch (error: any) {
        console.error(`Error fetching subject ${c.req.param('uuid')}:`, error);
        c.status(500);
        return c.json({
          message: "Failed to retrieve subject",
          error: error.message || "An unexpected error occurred",
        });
      }
    }
  );

  // --- DELETE /:uuid ---
  // Deletes a specific subject by its UUID.
  api.delete(
    "/:uuid",
    zValidator("param", validateUUID), // Validate UUID
    async (c) => {
      try {
        const { uuid: subjectId } = c.req.valid("param");
        // Use the service layer to delete the subject
        const subjectDeleted = await service.deleteSpecificFromUUID(subjectId);

        // Check if the service indicated successful deletion (adjust based on service return value)
        if (!subjectDeleted) { // Assuming service returns null/undefined or throws if not found/deleted
          c.status(404);
          return c.json({ message: "Subject not found or could not be deleted" });
        }

        return c.json({
          message: "Subject deleted successfully",
          data: subjectDeleted, // Or potentially just a success status
        });
      } catch (error: any) {
        console.error(`Error deleting subject ${c.req.param('uuid')}:`, error);
        c.status(500);
        return c.json({
          message: "Failed to delete subject",
          error: error.message || "An unexpected error occurred",
        });
      }
    }
  );

  // --- PUT /:uuid ---
  // Updates a specific subject by its UUID.
  api.put(
    "/:uuid",
    zValidator("param", validateUUID), // Validate UUID
    zValidator("json", updateSubjectSchema), // Validate request body for update
    async (c) => {
      try {
        const { uuid: subjectId } = c.req.valid("param");
        const updateData = c.req.valid("json");

        // Use the service layer to update the subject
        const updatedSubject = await service.updateSpecificFromUUID(
          subjectId,
          updateData
        );

        if (!updatedSubject) { // Assuming service returns null/undefined or throws if not found
          c.status(404);
          return c.json({ message: "Subject not found or could not be updated" });
        }

        return c.json({
          message: "Subject updated successfully",
          data: updatedSubject,
        });
      } catch (error: any) {
        console.error(`Error updating subject ${c.req.param('uuid')}:`, error);
        c.status(500);
        return c.json({
          message: "Failed to update subject",
          error: error.message || "An unexpected error occurred",
        });
      }
    }
  );

  return api;
}

// --- Initialization ---
// Create an instance of the SubjectService, passing the database connection
const service = new SubjectServiceClass(db); // Pass the imported db instance

// Create the Hono router instance by calling the setup function
const SubjectRoute = startSubjectRoute(service, db); // Pass both service and db

// Export the configured router
export { SubjectRoute };
