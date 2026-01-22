'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Send, Monitor, Loader2 } from 'lucide-react'
import { saveTemplate, sendTestEmail } from './actions'
import { useRouter } from 'next/navigation'
import { getBaseEmailHtml } from '@/lib/email-templates'

// Use a mocked or server-derived version of getBaseEmailHtml if needed on client, 
// or simply reconstruct the simple wrapper here for immediate preview.
// Since we can't import server functions directly to client without 'use server', 
// we'll implement a simple client-side wrapper that mimics it perfectly.

function getPreviewHtml(headline: string, content: string) {
    // Basic CSS mirroring the Server Template
    return `
        <html>
            <body style="margin:0;padding:20px;font-family:sans-serif;background:#f9fafb;">
                <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                    <div style="background:#000;padding:30px 40px;text-align:center;">
                        <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">LOJA<span style="color:#dc2626;">.</span></h1>
                    </div>
                    <div style="padding:40px;color:#333;line-height:1.6;">
                        ${headline ? `<h1 style="font-size:24px;font-weight:700;margin:0 0 20px 0;">${headline}</h1>` : ''}
                        ${content.replace(/\n/g, '<br/>')}
                    </div>
                    <div style="background:#f9fafb;padding:24px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                        <p>Enviado da Loja de Grupos.</p>
                        &copy; ${new Date().getFullYear()} Loja de Grupos.
                    </div>
                </div>
            </body>
        </html>
    `
}

interface EditorProps {
    initialData?: {
        id: string
        name: string
        subject: string
        body: string
    }
}

export default function EmailEditor({ initialData }: EditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [testLoading, setTestLoading] = useState(false)

    // Form State
    const [name, setName] = useState(initialData?.name || '')
    const [subject, setSubject] = useState(initialData?.subject || '')
    const [body, setBody] = useState(initialData?.body || '')
    const [testEmail, setTestEmail] = useState('')
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

    async function handleSave() {
        if (!name || !subject || !body) return alert('Preencha todos os campos')
        setLoading(true)
        await saveTemplate(initialData?.id || null, name, subject, body)
        setLoading(false)
        router.push('/bobao/dashboard/emails')
        router.refresh()
    }

    async function handleTestSend() {
        if (!testEmail || !testEmail.includes('@')) return alert('Digite um email válido para teste')
        setTestLoading(true)
        const res = await sendTestEmail(testEmail, subject, { content: body }) // Only passing body content as 'content'
        setTestLoading(false)
        if (res.success) alert('Email de teste enviado!')
        else alert('Erro ao enviar teste: ' + res.error)
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Nome do Modelo (ex: Boas Vindas)"
                        className="w-64 bg-zinc-900 border-zinc-700"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-2 items-center mr-4 border-r border-zinc-700 pr-4">
                        <Input
                            placeholder="Email para teste..."
                            className="w-64 bg-zinc-900 border-zinc-700 h-9 text-xs"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                        />
                        <Button size="sm" variant="secondary" onClick={handleTestSend} disabled={testLoading}>
                            {testLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Send className="w-3 h-3 mr-2" />}
                            Testar
                        </Button>
                    </div>
                    <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Template
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {/* Mobile: Tabs */}
                <div className="md:hidden h-full flex flex-col">
                    <div className="flex border-b border-zinc-800 mb-4">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'editor' ? 'border-red-600 text-white' : 'border-transparent text-zinc-500'}`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-red-600 text-white' : 'border-transparent text-zinc-500'}`}
                        >
                            Preview
                        </button>
                    </div>

                    {activeTab === 'editor' ? (
                        <div className="flex flex-col gap-4 h-full overflow-y-auto pb-20">
                            <div className="space-y-2">
                                <Label>Assunto do Email</Label>
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Ex: Seu acesso chegou! 🚀"
                                    className="bg-zinc-900 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                                <Label>Conteúdo (HTML Aceito)</Label>
                                <Textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Olá, <br/><br/> Escreva aqui seu email..."
                                    className="flex-1 bg-zinc-900 border-zinc-700 font-mono text-sm leading-relaxed p-4 resize-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-lg overflow-hidden border border-zinc-800">
                            <iframe
                                srcDoc={getPreviewHtml(subject, body)}
                                className="w-full h-full"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    )}
                </div>

                {/* Desktop: Split Screen */}
                <div className="hidden md:grid grid-cols-2 gap-6 h-full">
                    {/* Left: Input */}
                    <div className="flex flex-col gap-4 h-full">
                        <div className="space-y-2">
                            <Label>Assunto do Email</Label>
                            <Input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Ex: Seu acesso chegou! 🚀"
                                className="bg-zinc-900 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label>Conteúdo (HTML Aceito)</Label>
                            <Textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Olá, <br/><br/> Escreva aqui seu email..."
                                className="flex-1 bg-zinc-900 border-zinc-700 font-mono text-sm leading-relaxed p-4 resize-none"
                            />
                            <p className="text-xs text-zinc-500">
                                Dica: Use <code>&lt;br/&gt;</code> para pular linhas e <code>&lt;b&gt;texto&lt;/b&gt;</code> para negrito.
                            </p>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex flex-col gap-2 h-full">
                        <Label className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" /> Preview em Tempo Real
                        </Label>
                        <div className="flex-1 border-2 border-dashed border-zinc-700 rounded-xl overflow-hidden bg-white">
                            <iframe
                                srcDoc={getPreviewHtml(subject, body)}
                                className="w-full h-full"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
