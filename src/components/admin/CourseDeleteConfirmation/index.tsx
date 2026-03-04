'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'
import './styles.scss'

interface RelatedCounts {
  enrollments: number
  quizAttempts: number
  comments: number
  likes: number
}

const CourseDeleteConfirmation: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [counts, setCounts] = useState<RelatedCounts | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchCounts = async () => {
      try {
        const [enrollments, quizAttempts, comments, likes] = await Promise.all([
          fetch(`/api/enrollments?where[course][equals]=${id}&limit=0`).then((r) => r.json()),
          fetch(`/api/quiz-attempts?where[course][equals]=${id}&limit=0`).then((r) => r.json()),
          fetch(
            `/api/comments?where[and][0][targetCollection][equals]=courses&where[and][1][targetId][equals]=${id}&limit=0`,
          ).then((r) => r.json()),
          fetch(
            `/api/likes?where[and][0][targetCollection][equals]=courses&where[and][1][targetId][equals]=${id}&limit=0`,
          ).then((r) => r.json()),
        ])
        setCounts({
          enrollments: enrollments.totalDocs ?? 0,
          quizAttempts: quizAttempts.totalDocs ?? 0,
          comments: comments.totalDocs ?? 0,
          likes: likes.totalDocs ?? 0,
        })
      } catch {
        /* counts stay null */
      }
    }

    fetchCounts()
  }, [id])

  const handleDelete = useCallback(async () => {
    if (!id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/collections/courses')
      } else {
        setDeleting(false)
        setShowModal(false)
      }
    } catch {
      setDeleting(false)
      setShowModal(false)
    }
  }, [id, router])

  if (!id) return null

  const total = counts
    ? counts.enrollments + counts.quizAttempts + counts.comments + counts.likes
    : 0
  const hasRelated = counts !== null && total > 0

  return (
    <div className="course-delete">
      {hasRelated && (
        <div className="course-delete__warning">
          <strong>Увага!</strong> Цей курс має пов&#39;язані дані:
          <ul>
            {counts.enrollments > 0 && <li>Записів на курс: {counts.enrollments}</li>}
            {counts.quizAttempts > 0 && <li>Спроб тесту: {counts.quizAttempts}</li>}
            {counts.comments > 0 && <li>Коментарів: {counts.comments}</li>}
            {counts.likes > 0 && <li>Лайків: {counts.likes}</li>}
          </ul>
          Видалення курсу також видалить усі ці записи.
        </div>
      )}

      <button
        className="course-delete__button"
        type="button"
        onClick={() => setShowModal(true)}
      >
        Видалити курс
      </button>

      {showModal && (
        <div className="course-delete__overlay" onClick={() => !deleting && setShowModal(false)}>
          <div className="course-delete__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Підтвердження видалення</h3>

            {hasRelated ? (
              <>
                <p>Ви впевнені? Разом із курсом буде безповоротно видалено:</p>
                <ul className="course-delete__modal-list">
                  {counts.enrollments > 0 && <li>{counts.enrollments} записів на курс</li>}
                  {counts.quizAttempts > 0 && <li>{counts.quizAttempts} спроб тесту</li>}
                  {counts.comments > 0 && <li>{counts.comments} коментарів</li>}
                  {counts.likes > 0 && <li>{counts.likes} лайків</li>}
                </ul>
              </>
            ) : (
              <p>Ви впевнені що хочете видалити цей курс?</p>
            )}

            <p className="course-delete__irreversible">Цю дію неможливо скасувати.</p>

            <div className="course-delete__modal-actions">
              <button
                className="course-delete__cancel"
                type="button"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Скасувати
              </button>
              <button
                className="course-delete__confirm"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Видалення...' : 'Так, видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDeleteConfirmation
