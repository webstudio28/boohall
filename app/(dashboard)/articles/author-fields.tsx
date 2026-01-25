
'use client'

import { useState } from 'react'
import { User, ChevronDown } from 'lucide-react'

interface SavedAuthor {
    id: string
    name: string
    bio: string | null
}

interface AuthorFieldsProps {
    savedAuthors: SavedAuthor[]
}

export function AuthorFields({ savedAuthors }: AuthorFieldsProps) {
    const [selectedAuthorId, setSelectedAuthorId] = useState<string>('')
    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [saveForFuture, setSaveForFuture] = useState(false)

    const handleAuthorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setSelectedAuthorId(id)
        if (id) {
            const author = savedAuthors.find(a => a.id === id)
            if (author) {
                setName(author.name)
                setBio(author.bio || '')
                setSaveForFuture(false) // Don't save if already saved
            }
        } else {
            setName('')
            setBio('')
        }
    }

    return (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-900 flex items-center">
                    <User className="mr-2 h-4 w-4 text-zinc-500" />
                    Author Persona (Optional)
                </h3>
            </div>

            {savedAuthors.length > 0 && (
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                        Load Saved Author
                    </label>
                    <div className="relative">
                        <select
                            value={selectedAuthorId}
                            onChange={handleAuthorSelect}
                            className="block w-full appearance-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-black focus:ring-black"
                        >
                            <option value="">-- Create New --</option>
                            {savedAuthors.map(author => (
                                <option key={author.id} value={author.id}>
                                    {author.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label htmlFor="authorName" className="block text-sm font-medium text-zinc-700">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="authorName"
                        id="authorName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Elena Petrova"
                        className="mt-1 block w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
                    />
                </div>

                <div>
                    <label htmlFor="authorBio" className="block text-sm font-medium text-zinc-700">
                        Expertise / Bio
                    </label>
                    <input
                        type="text"
                        name="authorBio"
                        id="authorBio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. SEO Expert with 10+ years experience"
                        className="mt-1 block w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
                    />
                </div>

                {!selectedAuthorId && (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="saveAuthor"
                            id="saveAuthor"
                            checked={saveForFuture}
                            onChange={(e) => setSaveForFuture(e.target.checked)}
                            value="true"
                            className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                        />
                        <label htmlFor="saveAuthor" className="ml-2 block text-sm text-zinc-600">
                            Save this author for future use
                        </label>
                    </div>
                )}
            </div>
        </div>
    )
}
