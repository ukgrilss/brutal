import EmailEditor from '../editor'
import { getTemplate } from '../actions'
import { notFound } from 'next/navigation'

export default async function EditEmailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const template = await getTemplate(id)

    if (!template) return notFound()

    return <EmailEditor initialData={template} />
}
