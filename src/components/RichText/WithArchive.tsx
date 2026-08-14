import React from 'react'
import type { SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type { ArchiveBlock as ArchiveBlockProps } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import RichText, { jsxConverters, type NodeTypes } from '@/components/RichText'

type Props = {
  locale?: SiteLocale
} & Omit<React.ComponentProps<typeof RichText>, 'converters'>

// Server-only: the Archive renderer pulls in the Payload Local API, which must never end
// up in a client bundle, so it stays out of the shared RichText component.
export default function RichTextWithArchive({ locale, ...rest }: Props) {
  const converters: JSXConvertersFunction<
    NodeTypes | SerializedBlockNode<ArchiveBlockProps>
  > = (args) => {
    const base = jsxConverters(args)
    return {
      ...base,
      blocks: {
        ...base.blocks,
        archive: ({ node }) => <ArchiveBlock {...node.fields} locale={locale} />,
      },
    }
  }

  return <RichText converters={converters as JSXConvertersFunction<NodeTypes>} {...rest} />
}
