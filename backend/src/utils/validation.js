const { HttpError } = require("./httpError");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUUID(id, label = "ID") {
  if (!uuidPattern.test(id)) {
    throw new HttpError(400, `${label} must be a valid UUID.`);
  }
  return id;
}

function getPagination(query) {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 20);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new HttpError(400, "page must be at least 1 and pageSize must be between 1 and 100.");
  }
  return { page, pageSize };
}

module.exports = {
  uuidPattern,
  emailPattern,
  validateUUID,
  getPagination,
};
