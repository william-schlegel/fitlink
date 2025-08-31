CREATE TABLE "PageSectionElementDocuments" (
	"id" text PRIMARY KEY NOT NULL,
	"element_id" text NOT NULL,
	"document_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PageSectionElementDocuments" ADD CONSTRAINT "PageSectionElementDocuments_element_id_PageSectionElement_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."PageSectionElement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PageSectionElementDocuments" ADD CONSTRAINT "PageSectionElementDocuments_document_id_UserDocument_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."UserDocument"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pse_documents_element_idx" ON "PageSectionElementDocuments" USING btree ("element_id");--> statement-breakpoint
CREATE INDEX "pse_documents_document_idx" ON "PageSectionElementDocuments" USING btree ("document_id");