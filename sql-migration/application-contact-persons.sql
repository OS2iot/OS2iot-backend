-- Migrate deprecated application contact information to contact persons.

-- -----------------------------------------------------------------------------

-- Create a contact person for each application having full contact information, i.e. name, email and phone.

INSERT INTO contact_person("applicationId", "name", "email", "phone")
SELECT id,
       "contactPerson",
       "contactEmail",
       "contactPhone"
FROM application
WHERE COALESCE("contactPerson", '') != ''
  AND COALESCE("contactEmail", '') != ''
  AND COALESCE("contactPhone", '') != ''
;

-- Clear deprecated contact information (which has been migrated to contact persons).

UPDATE application
SET "contactPerson" = '',
    "contactEmail" = '',
    "contactPhone" = ''
FROM contact_person
WHERE contact_person."applicationId" = application.id
  AND contact_person."name" = application."contactPerson"
  AND contact_person."email" = application."contactEmail"
  AND contact_person."phone" = application."contactPhone"
;
