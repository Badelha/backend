const getPagination = (page = 1, limit = 20) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

const getPaginationResponse = (items, total, page, limit) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const totalPages = Math.ceil(total / limitNum);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};

module.exports = { getPagination, getPaginationResponse };