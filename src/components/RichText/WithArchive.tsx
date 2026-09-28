import React from 'react'
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type {
  ArchiveBlock as ArchiveBlockProps,
  EventsBlock as EventsBlockProps,
} from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { EventsBlockComponent } from '@/blocks/EventsBlock/Component'
import RichText, { jsxConverters, type NodeTypes } from '@/components/RichText'

type Props = {
  locale?: SiteLocale
} & Omit<React.ComponentProps<typeof RichText>, 'converters'>

// Server-only: the Archive and Events renderers pull in the Payload Local API, which must
// never end up in a client bundle, so they stay out of the shared RichText component.
export default function RichTextWithArchive({ locale, ...rest }: Props) {
  const converters: JSXConvertersFunction<
    NodeTypes | SerializedBlockNode<ArchiveBlockProps | EventsBlockProps>
  > = (args) => {
    const base = jsxConverters(args)
    return {
      ...base,
      blocks: {
        ...base.blocks,
        archive: ({ node }) => {
          const { id, ...fields } = node.fields as ArchiveBlockProps
          return <ArchiveBlock {...fields} id={id ?? undefined} locale={locale} />
        },
        eventsBlock: ({ node }) => {
          const { id, ...fields } = node.fields as EventsBlockProps
          return <EventsBlockComponent {...fields} id={id ?? undefined} locale={locale} />
        },
      },
    }
  }

  return <RichText converters={converters as JSXConvertersFunction<NodeTypes>} {...rest} />
}
