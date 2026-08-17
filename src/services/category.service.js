const prisma = require('../config/prisma');

class CategoryService {
  /**
   * Get all categories
   */
  static async getAllCategories() {
    const categories = await prisma.category.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        children: {
          where: { deleted_at: null },
        },
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    // Return only top-level categories with their children
    return categories.filter(cat => !cat.parent_category_id);
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        category_id: Number(categoryId),
        deleted_at: null,
      },
      include: {
        parent: {
          where: { deleted_at: null },
        },
        children: {
          where: { deleted_at: null },
        },
        products: {
          where: {
            deleted_at: null,
            availability_status: 'AVAILABLE',
          },
          take: 10,
        },
      },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    return category;
  }

  /**
   * Create category (admin only)
   */
  static async createCategory(data) {
    const existing = await prisma.category.findUnique({
      where: { category_name: data.name },
    });

    if (existing) {
      throw new Error('CATEGORY_EXISTS');
    }

    const category = await prisma.category.create({
      data: {
        category_name: data.name,
        description: data.description,
        icon: data.icon,
        parent_category_id: data.parentId ? Number(data.parentId) : null,
        display_order: data.displayOrder || 0,
      },
    });

    return category;
  }

  /**
   * Update category (admin only)
   */
  static async updateCategory(categoryId, data) {
    const category = await prisma.category.findFirst({
      where: {
        category_id: Number(categoryId),
        deleted_at: null,
      },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    const updateData = {};
    if (data.name) updateData.category_name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

    const updatedCategory = await prisma.category.update({
      where: { category_id: Number(categoryId) },
      data: updateData,
    });

    return updatedCategory;
  }

  /**
   * Delete category (soft delete)
   */
  static async deleteCategory(categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        category_id: Number(categoryId),
        deleted_at: null,
      },
      include: {
        products: {
          where: { deleted_at: null },
        },
      },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    if (category.products.length > 0) {
      throw new Error('CATEGORY_HAS_PRODUCTS');
    }

    await prisma.category.update({
      where: { category_id: Number(categoryId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Category deleted successfully' };
  }
}

module.exports = CategoryService;