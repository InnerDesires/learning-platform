'use client'

import type { OptionObject } from 'payload'

import { Button, Modal, Select, TextInput, toast, useConfig, useModal } from '@payloadcms/ui'
import { Copy, Loader2, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

import './index.scss'

const baseClass = 'invite-user-modal'
const modalSlug = 'invite-user-modal'

// Endpoints registered on the users collection by payload-auth
// (see adminEndpoints in payload-auth/better-auth/plugin/constants).
const GENERATE_INVITE_URL = '/generate-invite-url'
const SEND_INVITE = '/send-invite'

const roleLabels: Record<string, string> = {
  admin: 'Адміністратор',
  learner: 'Учасник',
}

type SelectOption = { label: string; value: string }

export function InviteUserButton({ roles }: { roles: OptionObject[] }) {
  const [role, setRole] = useState<SelectOption | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopyLoading, setIsCopyLoading] = useState(false)
  const { toggleModal } = useModal()
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
      admin: { user: userSlug },
      serverURL,
    },
  } = useConfig()

  const pathname = usePathname()
  if (pathname !== `${adminRoute}/collections/${userSlug}`) return null

  const options: SelectOption[] = roles.map((option) => ({
    label: roleLabels[option.value] ?? String(option.label),
    value: option.value,
  }))

  const handleGenerateInvite = async (): Promise<string | null> => {
    if (!role) {
      toast.error('Спочатку оберіть роль')
      return null
    }
    try {
      const url = `${serverURL}${apiRoute}/${userSlug}${GENERATE_INVITE_URL}`
      const response = await fetch(url, {
        // The endpoint validates `body.role.value`, so it needs the full
        // option object, not just the value string.
        body: JSON.stringify({ role }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate invite')
      const data = await response.json()
      setInviteLink(data.inviteLink)
      return data.inviteLink
    } catch {
      toast.error('Не вдалося створити посилання-запрошення')
      return null
    }
  }

  const handleSendEmail = async () => {
    if (!role) {
      toast.error('Спочатку оберіть роль')
      return
    }
    if (!email) {
      toast.error('Вкажіть email-адресу')
      return
    }
    try {
      setIsLoading(true)
      let linkToSend = inviteLink
      if (!linkToSend) {
        linkToSend = (await handleGenerateInvite()) ?? ''
      }
      if (linkToSend) {
        const response = await fetch(`${serverURL}${apiRoute}/${userSlug}${SEND_INVITE}`, {
          body: JSON.stringify({ email, link: linkToSend }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) throw new Error('Failed to send invite')
        toast.success('Запрошення надіслано')
        toggleModal(modalSlug)
      }
    } catch {
      toast.error('Не вдалося надіслати запрошення')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!role) {
      toast.error('Спочатку оберіть роль')
      return
    }
    try {
      setIsCopyLoading(true)
      let linkToCopy = inviteLink
      if (!linkToCopy) {
        linkToCopy = (await handleGenerateInvite()) ?? ''
      }
      if (linkToCopy) {
        await navigator.clipboard.writeText(linkToCopy)
        toast.success('Посилання скопійовано')
        toggleModal(modalSlug)
      }
    } catch {
      toast.error('Не вдалося скопіювати посилання')
    } finally {
      setIsCopyLoading(false)
    }
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="pill"
        className="invite-user-button"
        onClick={() => toggleModal(modalSlug)}
        size="small"
        type="button"
      >
        Запросити користувача
      </Button>
      <Modal className={baseClass} closeOnBlur slug={modalSlug}>
        <div className={`${baseClass}__wrapper`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__close-button`}
            onClick={() => toggleModal(modalSlug)}
            size="small"
          >
            <XIcon size={24} />
          </Button>
          <div className={`${baseClass}__content`}>
            <h2>Запросити користувача</h2>
            <p>
              Оберіть роль і надішліть запрошення на email або скопіюйте посилання-запрошення.
            </p>
            <Select
              onChange={(option) => setRole(option as SelectOption)}
              options={options}
              placeholder="Оберіть роль"
              value={role}
            />
            <div className={`${baseClass}__invite-controls`}>
              <div className={`${baseClass}__email-field`}>
                <TextInput
                  label="Email-адреса"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  path="email"
                  placeholder="user@example.com"
                  value={email}
                />
              </div>
              <div className={`${baseClass}__buttons`}>
                <Button disabled={isLoading || !role || !email} onClick={handleSendEmail} type="button">
                  {isLoading ? <Loader2 className={`${baseClass}__spinner`} size={20} /> : null}
                  Надіслати на email
                </Button>
                <Button
                  buttonStyle="transparent"
                  disabled={isCopyLoading || !role}
                  onClick={handleCopyLink}
                  size="medium"
                  type="button"
                >
                  {isCopyLoading ? (
                    <Loader2 className={`${baseClass}__spinner`} size={20} strokeWidth={1.5} />
                  ) : (
                    <Copy size={20} strokeWidth={1.5} />
                  )}
                  Скопіювати посилання
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </React.Fragment>
  )
}
