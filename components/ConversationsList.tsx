import React, { FC, useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { ChatIcon } from '@heroicons/react/outline'
import Address from './Address'
import { useRouter } from 'next/router'
import { Conversation } from '@xmtp/xmtp-js'
import { classNames, formatDate, getConversationKey } from '../helpers'
import Avatar from './Avatar'
import { useAppStore } from '../store/app'
import useGetPreviewList from '../hooks/useGetPreviewList'

type ConversationTileProps = {
  conversation: Conversation
  onClick?: () => void
}

const ConversationTile = ({
  conversation,
  onClick,
}: ConversationTileProps): JSX.Element | null => {
  const router = useRouter()

  const address = useAppStore((state) => state.address)
  const previewMessages = useAppStore((state) => state.previewMessages)
  const loadingConversations = useAppStore(
    (state) => state.loadingConversations
  )
  const recipentAddress = Array.isArray(router.query.recipientWalletAddr)
    ? router.query.recipientWalletAddr.join('/')
    : router.query.recipientWalletAddr

  const convoKey = getConversationKey(conversation)

  if (!previewMessages.get(convoKey)) {
    return null
  }

  const latestMessage = previewMessages.get(convoKey)

  const path = `/dm/${convoKey}`

  const conversationDomain =
    conversation.context?.conversationId.split('.')[0] ?? ''

  const isSelected = recipentAddress === convoKey

  return (
    <Link href={path} key={convoKey}>
      <a onClick={onClick}>
        <div
          className={classNames(
            'h-20',
            'py-2',
            'px-4',
            'md:max-w-sm',
            'mx-auto',
            'bg-white',
            'space-y-2',
            'py-2',
            'flex',
            'items-center',
            'space-y-0',
            'space-x-4',
            'border-b-2',
            'border-gray-100',
            'hover:bg-bt-100',
            loadingConversations ? 'opacity-80' : 'opacity-100',
            isSelected ? 'bg-bt-200' : null
          )}
        >
          <Avatar peerAddress={conversation.peerAddress} />
          <div className="py-4 sm:text-left text w-full">
            {conversationDomain && (
              <div className="text-sm rounded-2xl text-white bg-black w-max px-2 font-bold">
                {conversationDomain.toLocaleUpperCase()}
              </div>
            )}
            <div className="grid-cols-2 grid">
              <Address
                address={conversation.peerAddress}
                className="text-black text-lg md:text-md font-bold place-self-start"
              />
              <span
                className={classNames(
                  'text-lg md:text-sm font-normal place-self-end',
                  isSelected ? 'text-n-500' : 'text-n-300',
                  loadingConversations ? 'animate-pulse' : ''
                )}
              >
                {formatDate(latestMessage?.sent)}
              </span>
            </div>
            <span className="text-sm text-gray-500 line-clamp-1 break-all">
              {address === latestMessage?.senderAddress && 'You: '}{' '}
              {latestMessage?.content}
            </span>
          </div>
        </div>
      </a>
    </Link>
  )
}

const LoadingMore: FC = () => (
  <div className="p-1 mt-6 text-center text-gray-300 font-bold text-sm">
    Loading Conversations...
  </div>
)

const ConversationsList = (): JSX.Element => {
  const observer = useRef<IntersectionObserver | null>(null)
  const conversations = useAppStore((state) => state.conversations)
  const previewMessages = useAppStore((state) => state.previewMessages)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const { loading, hasMore } = useGetPreviewList(currentIndex)

  const lastElementRef = useCallback(
    // (*)
    (node) => {
      if (loading) {
        return
      }
      if (observer.current) {
        observer.current.disconnect()
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentIndex(currentIndex + 20)
        }
      })
      if (node) {
        observer.current.observe(node)
      }
    },
    [loading, hasMore, currentIndex]
  )

  const orderByLatestMessage = (
    convoA: Conversation,
    convoB: Conversation
  ): number => {
    const convoALastMessageDate =
      previewMessages.get(getConversationKey(convoA))?.sent || new Date()
    const convoBLastMessageDate =
      previewMessages.get(getConversationKey(convoB))?.sent || new Date()
    return convoALastMessageDate < convoBLastMessageDate ? 1 : -1
  }

  if (!conversations || conversations.size == 0) {
    return <NoConversationsMessage />
  }

  return (
    <>
      {conversations &&
        conversations.size > 0 &&
        Array.from(conversations.values())
          .sort(orderByLatestMessage)
          .map((convo, i) => {
            const isLastElement = conversations.size === i + 1
            return (
              <>
                <ConversationTile
                  key={getConversationKey(convo)}
                  conversation={convo}
                />
                {isLastElement && <div ref={lastElementRef}></div>}
              </>
            )
          })}
      {loading && <LoadingMore />}
    </>
  )
}

const NoConversationsMessage = (): JSX.Element => {
  return (
    <div className="flex flex-col flex-grow justify-center h-[100%]">
      <div className="flex flex-col items-center px-4 text-center">
        <ChatIcon
          className="h-8 w-8 mb-1 stroke-n-200 md:stroke-n-300"
          aria-hidden="true"
        />
        <p className="text-xl md:text-lg text-n-200 md:text-n-300 font-bold">
          Your message list is empty
        </p>
        <p className="text-lx md:text-md text-n-200 font-normal">
          There are no messages for this address
        </p>
      </div>
    </div>
  )
}

export default React.memo(ConversationsList)
