import type { CollectionAfterReadHook } from 'payload'

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors && doc?.authors?.length > 0) {
    const authorIds: number[] = doc.authors.map((author: { id: number } | number) =>
      typeof author === 'object' ? author?.id : author,
    )

    try {
      const { docs: authorDocs } = await payload.find({
        collection: 'users',
        where: { id: { in: authorIds } },
        depth: 0,
        limit: authorIds.length,
        req,
      })

      if (authorDocs.length > 0) {
        const byId = new Map(authorDocs.map((authorDoc) => [authorDoc.id, authorDoc]))
        doc.populatedAuthors = authorIds
          .map((id) => byId.get(id))
          .filter((authorDoc) => authorDoc !== undefined)
          .map((authorDoc) => ({
            id: authorDoc.id,
            name: authorDoc.name,
          }))
      }
    } catch {
      // swallow error
    }
  }

  return doc
}
