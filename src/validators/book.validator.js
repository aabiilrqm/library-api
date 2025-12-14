// book.validator.js
const Joi = require("joi");
const { paginationSchema, idParamSchema } = require("./common.validator");

exports.createBookSchema = {
  body: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    author: Joi.string().min(1).max(100).required(),
    isbn: Joi.string().min(10).max(13).required(),
    category: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(500).optional(),
    quantity: Joi.number().integer().min(1).default(1),
    publishedAt: Joi.date().iso().optional(),
  }),
};

exports.updateBookSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: Joi.string().min(1).max(200),
    author: Joi.string().min(1).max(100),
    isbn: Joi.string().min(10).max(13),
    category: Joi.string().min(1).max(50),
    description: Joi.string().max(500),
    quantity: Joi.number().integer().min(1),
    publishedAt: Joi.date().iso(),
  }).min(1),
};

exports.getBooksSchema = {
  query: paginationSchema.append({
    search: Joi.string().max(100),
    category: Joi.string().max(50),
    author: Joi.string().max(100),
    sortBy: Joi.string()
      .valid(
        "title",
        "author",
        "category",
        "createdAt",
        "quantity",
        "available"
      )
      .default("title"),
    order: Joi.string().valid("asc", "desc").default("asc"),
  }),
};
