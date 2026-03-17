import { useState, useRef, useEffect } from 'react'
import { useFavorites } from '../../context/FavoritesContext'
import './Favorites.css'

const FAV_TABS = ['Radar', 'ESP', 'MO']

const mockMolecules = [
  { id: 1, smiles: 'FC(F)C(F)|F|COC(F)(F)C(F)F', molWeight: 168.04, homo: -7.2, lumo: -0.8, combEnthalpy: 12.4, commercial: 'Likely commercially availa...', espMin: -0.42, espMax: 0.38, funcGroups: ['Ether', 'Halide', 'FluoroEt...'], umapX: 2.1, umapY: -0.5, addedDate: 'Jul 16, 2025, 07:12 AM' },
  { id: 2, smiles: 'CCOCC(F)(F)F', molWeight: 132.12, homo: -6.9, lumo: -0.6, combEnthalpy: 11.8, commercial: 'N/A', espMin: -0.35, espMax: 0.32, funcGroups: ['Ether', 'Halide'], umapX: 1.8, umapY: 0.2, addedDate: 'Jul 15, 2025, 03:45 PM' },
  { id: 3, smiles: 'C1=CC=C(C=C1)OP(=O)(O)O', molWeight: 174.09, homo: -7.5, lumo: -1.1, combEnthalpy: 14.2, commercial: 'Likely synthesizable but pr...', espMin: -0.48, espMax: 0.41, funcGroups: ['Phosphate'], umapX: -0.3, umapY: 1.1, addedDate: 'Jul 14, 2025, 10:20 AM' },
  { id: 4, smiles: 'CN(C)C(=O)N(C)C', molWeight: 88.11, homo: -6.7, lumo: -0.5, combEnthalpy: 10.1, commercial: 'Likely commercially availa...', espMin: -0.31, espMax: 0.28, funcGroups: ['Amide'], umapX: 0.5, umapY: -0.8, addedDate: 'Jul 13, 2025, 09:00 AM' },
  { id: 5, smiles: 'CC(C)(C)c1ccc(cc1)S(=O)(=O)N', molWeight: 199.26, homo: -7.8, lumo: -1.3, combEnthalpy: 15.6, commercial: 'N/A', espMin: -0.52, espMax: 0.44, funcGroups: ['Sulfonamide'], umapX: -1.2, umapY: 0.4, addedDate: 'Jul 12, 2025, 02:30 PM' },
  { id: 6, smiles: 'F[C@H](F)[C@@H](F)O', molWeight: 102.05, homo: -7.0, lumo: -0.7, combEnthalpy: 11.2, commercial: 'Likely commercially availa...', espMin: -0.38, espMax: 0.35, funcGroups: ['Alcohol', 'Halide'], umapX: 1.0, umapY: -0.2, addedDate: 'Jul 11, 2025, 11:15 AM' },
  { id: 7, smiles: 'CCOC(=O)C(C)C(=O)OCC', molWeight: 174.19, homo: -7.3, lumo: -0.9, combEnthalpy: 13.0, commercial: 'Likely synthesizable but pr...', espMin: -0.45, espMax: 0.39, funcGroups: ['Ester'], umapX: 0.2, umapY: 0.9, addedDate: 'Jul 10, 2025, 08:45 AM' },
  { id: 8, smiles: 'c1ccc2c(c1)ccc3ccccc32', molWeight: 178.23, homo: -6.5, lumo: -0.4, combEnthalpy: 9.8, commercial: 'Likely commercially availa...', espMin: -0.28, espMax: 0.25, funcGroups: ['Aromatic'], umapX: -0.8, umapY: -0.6, addedDate: 'Jul 9, 2025, 04:00 PM' },
  { id: 9, smiles: 'N#CC(C)(C)C#N', molWeight: 82.10, homo: -8.1, lumo: -1.5, combEnthalpy: 16.2, commercial: 'N/A', espMin: -0.55, espMax: 0.48, funcGroups: ['Nitrile'], umapX: -0.5, umapY: 1.3, addedDate: 'Jul 8, 2025, 01:20 PM' },
]

function MoleculeIcon() {
  return (
    <svg className="fav-mol-icon" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="16" r="4" />
      <circle cx="24" cy="10" r="4" />
      <circle cx="24" cy="22" r="4" />
      <circle cx="36" cy="16" r="4" />
      <line x1="16" y1="16" x2="20" y2="12" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="28" y1="10" x2="32" y2="14" />
      <line x1="28" y1="22" x2="32" y2="18" />
    </svg>
  )
}

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites()
  const [activeTab, setActiveTab] = useState('Radar')
  const [search, setSearch] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [rows, setRows] = useState(() => (favorites.length ? favorites : mockMolecules))

  useEffect(() => {
    if (favorites.length) {
      setRows(favorites)
    }
  }, [favorites])

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.smiles.toLowerCase().includes(q) ||
      r.funcGroups.some((g) => g.toLowerCase().includes(q)) ||
      r.commercial.toLowerCase().includes(q)
    )
  })

  const toggleSelectAll = (checked) => {
    if (checked) setSelected(new Set(filtered.map((r) => r.id)))
    else setSelected(new Set())
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const removeRow = (e, id) => {
    e.stopPropagation()
    setRows((prev) => prev.filter((r) => r.id !== id))
    removeFavorite(id)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const selectAllRef = useRef(null)
  useEffect(() => {
    if (!selectAllRef.current) return
    selectAllRef.current.indeterminate = selected.size > 0 && selected.size < filtered.length
  }, [selected.size, filtered.length])

  return (
    <div className="fav-page">
      <div className="fav-toolbar">
        <div className="fav-tabs">
          {FAV_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`fav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="fav-search"
          placeholder="Search molecules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="fav-table-wrap">
        <table className="fav-table">
          <thead>
            <tr>
              <th className="fav-col-check">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  aria-label="Select all"
                />
              </th>
              <th className="fav-col-image">Image</th>
              <th>SMILES</th>
              <th>Molecular Weight</th>
              <th>HOMO (eV)</th>
              <th>LUMO (eV)</th>
              <th>Combustion Enthalpy (eV)</th>
              <th>Commercial Viability</th>
              <th>ESP Min (eV)</th>
              <th>ESP Max (eV)</th>
              <th>Functional Groups</th>
              <th>UMAP X/Y</th>
              <th className="fav-col-date">
                Added Date
                <button
                  type="button"
                  className="fav-sort-btn"
                  onClick={() => setSortDesc((d) => !d)}
                  title={sortDesc ? 'Descending' : 'Ascending'}
                  aria-label="Sort by date"
                >
                  ↓
                </button>
              </th>
              <th className="fav-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="fav-empty-cell">
                  No molecules match your search.
                </td>
              </tr>
            ) : (
              [...filtered]
                .sort((a, b) => {
                  const da = new Date(a.addedDate)
                  const db = new Date(b.addedDate)
                  return sortDesc ? db - da : da - db
                })
                .map((row) => (
                  <tr key={row.id}>
                    <td className="fav-col-check">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>
                    <td className="fav-col-image">
                      <MoleculeIcon />
                    </td>
                    <td className="fav-col-smiles">{row.smiles}</td>
                    <td>{row.molWeight}</td>
                    <td>{row.homo}</td>
                    <td>{row.lumo}</td>
                    <td>{row.combEnthalpy}</td>
                    <td className="fav-col-commercial">{row.commercial}</td>
                    <td>{row.espMin}</td>
                    <td>{row.espMax}</td>
                    <td className="fav-col-groups">{JSON.stringify(row.funcGroups)}</td>
                    <td>{`${row.umapX.toFixed(2)} / ${row.umapY.toFixed(2)}`}</td>
                    <td className="fav-col-date">{row.addedDate}</td>
                    <td className="fav-col-actions">
                      <button
                        type="button"
                        className="fav-action-remove"
                        onClick={(e) => removeRow(e, row.id)}
                        aria-label="Remove"
                        title="Remove"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
