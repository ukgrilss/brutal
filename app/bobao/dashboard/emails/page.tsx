import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Trash2, Edit } from 'lucide-react'
import { getTemplates, deleteTemplate } from './actions'
import { redirect } from 'next/navigation'

export default async function EmailsPage() {
    const templates = await getTemplates()

    async function deleteAction(formData: FormData) {
        'use server'
        const id = formData.get('id') as string
        await deleteTemplate(id)
        redirect('/bobao/dashboard/emails')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Emails & Templates</h1>
                    <p className="text-muted-foreground">Crie e gerencie os modelos de email da sua loja.</p>
                </div>
                <Link href="/bobao/dashboard/emails/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Template
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Mail className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/bobao/dashboard/emails/${template.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <form action={deleteAction}>
                                    <input type="hidden" name="id" value={template.id} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                        <p className="text-sm text-zinc-400 line-clamp-1 mb-4">Assunto: {template.subject}</p>

                        <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-4 flex justify-between">
                            <span>Criado em: {template.createdAt.toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                        <Mail className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300">Nenhum template criado</h3>
                        <p className="text-zinc-500 mb-6">Comece criando um modelo para seus clientes.</p>
                        <Link href="/bobao/dashboard/emails/new">
                            <Button variant="outline">Criar Primeiro Template</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
