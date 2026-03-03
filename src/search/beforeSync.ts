import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ req, originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  if (collection === 'courses') {
    const { slug, id, category, title, description, heroImage } = originalDoc

    const modifiedDoc: DocToSync = {
      ...searchDoc,
      slug,
      collectionType: 'courses',
      meta: {
        title,
        description: description || null,
        image: typeof heroImage === 'object' ? heroImage?.id : heroImage,
      },
      categories: [],
    }

    if (category) {
      const categoryId = typeof category === 'object' ? category.id : category
      const categoryTitle = typeof category === 'object' ? category.title : null

      if (categoryTitle) {
        modifiedDoc.categories = [
          { relationTo: 'course-categories', categoryID: String(categoryId), title: categoryTitle },
        ]
      } else if (categoryId) {
        const doc = await req.payload.findByID({
          collection: 'course-categories',
          id: categoryId,
          disableErrors: true,
          depth: 0,
          select: { title: true },
          req,
        })

        if (doc !== null) {
          modifiedDoc.categories = [
            {
              relationTo: 'course-categories',
              categoryID: String(categoryId),
              title: doc.title,
            },
          ]
        } else {
          console.error(
            `Failed. Course category not found when syncing 'courses' with id: '${id}' to search.`,
          )
        }
      }
    }

    return modifiedDoc
  }

  if (collection === 'course-categories') {
    const { slug, title, description, image } = originalDoc

    return {
      ...searchDoc,
      slug,
      collectionType: 'course-categories',
      meta: {
        title,
        description: description || null,
        image: typeof image === 'object' ? image?.id : image,
      },
      categories: [],
    }
  }

  const { slug, id, categories, title, meta } = originalDoc

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    collectionType: 'posts',
    meta: {
      ...meta,
      title: meta?.title || title,
      image: meta?.image?.id || meta?.image,
      description: meta?.description,
    },
    categories: [],
  }

  if (categories && Array.isArray(categories) && categories.length > 0) {
    const populatedCategories: { id: string | number; title: string }[] = []
    for (const category of categories) {
      if (!category) {
        continue
      }

      if (typeof category === 'object') {
        populatedCategories.push(category)
        continue
      }

      const doc = await req.payload.findByID({
        collection: 'categories',
        id: category,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      })

      if (doc !== null) {
        populatedCategories.push(doc)
      } else {
        console.error(
          `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search.`,
        )
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: 'categories',
      categoryID: String(each.id),
      title: each.title,
    }))
  }

  return modifiedDoc
}
