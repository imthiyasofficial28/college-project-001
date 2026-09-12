import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  CheckCircle2,
  Bookmark,
  Clock,
  User,
  Edit2,
  Trash2,
  BookMarked,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { LibraryItem, LibraryTransaction, UserRole } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';
import { Table } from '../ui/table.tsx';

export const LibraryView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation'>('catalog');
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [shelfLocation, setShelfLocation] = useState('Shelf 4B-12');
  const [callNumber, setCallNumber] = useState('QA76.R87 2024');
  const [totalCopies, setTotalCopies] = useState('5');
  const [availableCopies, setAvailableCopies] = useState('5');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Issue Book Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueItemId, setIssueItemId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRole, setBorrowerRole] = useState<UserRole>('STUDENT');
  const [dueDate, setDueDate] = useState('2025-11-15');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const loadData = async () => {
    try {
      const [it, tr] = await Promise.all([api.getLibraryItems(), api.getLibraryTransactions()]);
      setItems(it);
      setTransactions(tr);
      if (it.length > 0 && !issueItemId) {
        setIssueItemId(it[0].id);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setTitle('');
    setAuthor('');
    setIsbn(`978-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setCategory('Computer Science');
    setShelfLocation('Shelf 3A-01');
    setCallNumber('QA76.M92 2025');
    setTotalCopies('5');
    setAvailableCopies('5');
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setAuthor(item.author);
    setIsbn(item.isbn);
    setCategory(item.category);
    setShelfLocation(item.shelfLocation);
    setCallNumber(item.callNumber);
    setTotalCopies(String(item.totalCopies));
    setAvailableCopies(String(item.availableCopies));
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      alert('Title, Author, and ISBN are required.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const payload: Partial<LibraryItem> = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category: category.trim(),
        shelfLocation: shelfLocation.trim(),
        callNumber: callNumber.trim(),
        totalCopies: parseInt(totalCopies, 10) || 1,
        availableCopies: Math.min(parseInt(availableCopies, 10) || 0, parseInt(totalCopies, 10) || 1),
      };

      if (editingItem) {
        await api.updateLibraryItem(editingItem.id, payload);
      } else {
        await api.addLibraryItem(payload);
      }

      setIsItemModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save monograph item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${itemTitle}" from library catalog?`)) return;
    try {
      await api.deleteLibraryItem(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove library item');
    }
  };

  // Issue Book (Circulation)
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((it) => it.id === issueItemId);
    if (!item) {
      alert('Selected book not found');
      return;
    }
    if (item.availableCopies <= 0) {
      alert('No copies available for issue at this time.');
      return;
    }

    setIsSubmittingIssue(true);
    try {
      // Create transaction record
      const newTx: LibraryTransaction = {
        id: `tx_${Date.now()}`,
        itemId: item.id,
        itemTitle: item.title,
        userId: `usr_${Date.now()}`,
        userName: borrowerName.trim() || 'Student Patron',
        userRole: borrowerRole,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate,
        status: 'ISSUED',
        fineAmount: 0,
      };

      // Decrement available copies
      await api.updateLibraryItem(item.id, {
        availableCopies: Math.max(0, item.availableCopies - 1),
      });

      setTransactions((prev) => [newTx, ...prev]);
      setIsIssueModalOpen(false);
      setBorrowerName('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue book');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Return Book
  const handleReturnBook = async (tx: LibraryTransaction) => {
    try {
      const item = items.find((it) => it.id === tx.itemId);
      if (item) {
        await api.updateLibraryItem(item.id, {
          availableCopies: Math.min(item.totalCopies, item.availableCopies + 1),
        });
      }
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id
            ? { ...t, status: 'RETURNED' as const, returnDate: new Date().toISOString().split('T')[0] }
            : t
        )
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record book return');
    }
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesQuery =
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.isbn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set(items.map((i) => i.category)));

  const catalogColumns = [
    {
      key: 'isbn',
      header: 'ISBN / Identifier',
      render: (item: LibraryItem) => (
        <div>
          <span className="font-mono text-cyan-400 text-xs font-semibold">{item.isbn}</span>
          <div className="text-[10px] text-slate-500 font-mono">Call: {item.callNumber}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title & Author',
      render: (item: LibraryItem) => (
        <div>
          <div className="font-semibold text-slate-100 text-xs">{item.title}</div>
          <div className="text-[11px] text-slate-400">{item.author}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Shelf',
      render: (item: LibraryItem) => (
        <div>
          <Badge variant="neutral" size="sm">
            {item.category}
          </Badge>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Loc: {item.shelfLocation}</div>
        </div>
      ),
    },
    {
      key: 'availableCopies',
      header: 'Stock Availability',
      render: (item: LibraryItem) => (
        <div className="flex items-center gap-2">
          <Badge variant={item.availableCopies > 0 ? 'success' : 'danger'} size="sm">
            {item.availableCopies} / {item.totalCopies} Available
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (item: LibraryItem) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditItem(item)}
            title="Edit Library Item"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(item.id, item.title)}
            title="Delete Library Item"
            className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const circulationColumns = [
    {
      key: 'itemTitle',
      header: 'Circulated Title',
      render: (t: LibraryTransaction) => (
        <span className="font-semibold text-xs text-slate-100">{t.itemTitle || 'Library Monograph'}</span>
      ),
    },
    {
      key: 'userName',
      header: 'Borrower',
      render: (t: LibraryTransaction) => (
        <div>
          <div className="text-xs text-slate-200">{t.userName || 'Patron'}</div>
          <span className="text-[10px] font-mono text-cyan-400">{t.userRole}</span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Return Date',
      render: (t: LibraryTransaction) => (
        <span className="text-xs font-mono text-slate-300">{t.dueDate}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: LibraryTransaction) => (
        <Badge variant={t.status === 'RETURNED' ? 'success' : 'warning'} size="sm">
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Circulation Action',
      align: 'right' as const,
      render: (t: LibraryTransaction) => (
        <div className="flex items-center justify-end gap-2">
          {t.status === 'ISSUED' && (
            <Button size="sm" variant="secondary" onClick={() => handleReturnBook(t)}>
              Mark Returned
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Central Library Catalog & Circulation Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monograph accession inventory, shelf locations, and active student issue records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#0A101C] border border-slate-800">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Accession Catalog ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('circulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'circulation'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Circulation ({transactions.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={BookMarked}
            onClick={() => setIsIssueModalOpen(true)}
          >
            Issue Book
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateItem}
          >
            Add Book to Catalog
          </Button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search books by title, author, or ISBN..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-[#0A101C]'
                }`}
              >
                All
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-[#0A101C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Table
            columns={catalogColumns}
            data={filteredItems}
            keyExtractor={(it) => it.id}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <Table
          columns={circulationColumns}
          data={transactions}
          keyExtractor={(tr) => tr.id}
          isLoading={isLoading}
        />
      )}

      {/* Add / Edit Monograph Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Library Catalog Entry' : 'Add Book / Monograph to Catalog'}
        subtitle="Registers physical text into central knowledge library with accession indexing"
        maxWidth="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            label="Monograph Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Algorithms, 4th Edition"
          />

          <Input
            label="Author(s)"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Thomas H. Cormen, Charles E. Leiserson"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ISBN / Barcode"
              required
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-0262046305"
            />
            <Select
              label="Discipline / Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Electronics & Hardware', label: 'Electronics & Hardware' },
                { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
                { value: 'Mathematics & Algorithms', label: 'Mathematics & Algorithms' },
                { value: 'Physics & Quantum', label: 'Physics & Quantum' },
                { value: 'Management & Economics', label: 'Management & Economics' },
                { value: 'Humanities & Social Sciences', label: 'Humanities & Social Sciences' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Shelf Location"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              placeholder="e.g. Shelf 4B-12"
            />
            <Input
              label="Call Number"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              placeholder="e.g. QA76.6 .C662 2022"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Physical Copies"
              required
              type="number"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
            />
            <Input
              label="Available Shelf Copies"
              required
              type="number"
              value={availableCopies}
              onChange={(e) => setAvailableCopies(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingItem}>
              {editingItem ? 'Save Changes' : 'Add to Catalog'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Book Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Book to Patron"
        subtitle="Records circulation loan transaction and allocates item from inventory"
        maxWidth="md"
      >
        <form onSubmit={handleIssueBook} className="space-y-4">
          <Select
            label="Monograph to Issue"
            value={issueItemId}
            onChange={(e) => setIssueItemId(e.target.value)}
            options={items.map((it) => ({
              value: it.id,
              label: `${it.title} (${it.availableCopies}/${it.totalCopies} Avail)`,
            }))}
          />

          <Input
            label="Patron / Borrower Name"
            required
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="e.g. Alex Rivera (STU-2025-001)"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Patron Role"
              value={borrowerRole}
              onChange={(e) => setBorrowerRole(e.target.value as UserRole)}
              options={[
                { value: 'STUDENT', label: 'Student' },
                { value: 'FACULTY', label: 'Faculty' },
                { value: 'STAFF', label: 'Staff' },
              ]}
            />
            <Input
              label="Due Return Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingIssue}>
              Issue Monograph
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
