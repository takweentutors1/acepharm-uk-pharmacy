'use client';

import React, { useState } from 'react';
import { Button, Badge, Card } from '@acepharm/ui';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Archive, 
  ArchiveRestore, 
  ArrowUp, 
  ArrowDown, 
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

export interface Subtopic {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Category {
  id: string;
  pathwayId: string;
  name: string;
  code: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  subtopics: Subtopic[];
}

export interface Pathway {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  categories: Category[];
}

const SEED_CURRICULUM: Pathway[] = [
  {
    id: 'p-mpharm',
    name: 'MPharm (Master of Pharmacy)',
    code: 'mpharm',
    description: 'UK General Pharmaceutical Council (GPhC) mapped undergraduate degree curriculum',
    sortOrder: 0,
    active: true,
    categories: [
      {
        id: 'cat-cv',
        pathwayId: 'p-mpharm',
        name: 'Cardiovascular System',
        code: 'cardiovascular',
        description: 'Hypertension, heart failure, arrhythmias, lipid management & acute coronary syndromes',
        sortOrder: 0,
        active: true,
        subtopics: [
          { id: 'sub-htn', categoryId: 'cat-cv', name: 'Hypertension Guidelines (NICE NG136)', code: 'htn-guidelines', description: 'Stepwise pharmacological management & monitoring', sortOrder: 0, active: true },
          { id: 'sub-hf', categoryId: 'cat-cv', name: 'Heart Failure with Reduced Ejection Fraction', code: 'hf-r-ef', description: 'Four pillars of guideline-directed medical therapy', sortOrder: 1, active: true },
          { id: 'sub-af', categoryId: 'cat-cv', name: 'Atrial Fibrillation & Anticoagulation (DOACs vs Warfarin)', code: 'af-anticoag', description: 'CHA2DS2-VASc, HAS-BLED & peri-operative bridging', sortOrder: 2, active: true },
          { id: 'sub-lipid', categoryId: 'cat-cv', name: 'Lipid Modification & Statin Therapy', code: 'lipid-statins', description: 'Primary & secondary cardiovascular prevention QRISK3', sortOrder: 3, active: true },
        ],
      },
      {
        id: 'cat-resp',
        pathwayId: 'p-mpharm',
        name: 'Respiratory System',
        code: 'respiratory',
        description: 'Asthma (BTS/SIGN & NICE), COPD, inhaler technique, and acute exacerbations',
        sortOrder: 1,
        active: true,
        subtopics: [
          { id: 'sub-asthma-adult', categoryId: 'cat-resp', name: 'Adult Asthma Management & Inhaler Step-Up', code: 'asthma-adult', description: 'MART regimes, SABA over-reliance & biologic indications', sortOrder: 0, active: true },
          { id: 'sub-copd', categoryId: 'cat-resp', name: 'COPD Maintenance & Exacerbation Protocol', code: 'copd-protocol', description: 'LAMA/LABA combinations, ICS blood eosinophil thresholds', sortOrder: 1, active: true },
        ],
      },
      {
        id: 'cat-endocrine',
        pathwayId: 'p-mpharm',
        name: 'Endocrine System',
        code: 'endocrine',
        description: 'Type 1 & Type 2 Diabetes, thyroid disorders, and adrenal insufficiency',
        sortOrder: 2,
        active: true,
        subtopics: [
          { id: 'sub-t2dm', categoryId: 'cat-endocrine', name: 'Type 2 Diabetes Pharmacotherapy', code: 't2dm-agents', description: 'SGLT2i cardiovascular/renal protection, GLP-1 RA criteria', sortOrder: 0, active: true },
          { id: 'sub-insulin', categoryId: 'cat-endocrine', name: 'Insulin Regimens & Sick Day Rules', code: 'insulin-sick-day', description: 'Basal-bolus calculation, hypoglycaemia reversal', sortOrder: 1, active: true },
        ],
      },
      {
        id: 'cat-calc',
        pathwayId: 'p-mpharm',
        name: 'Pharmaceutical Calculations',
        code: 'calculations',
        description: 'High-stakes GPhC Paper 1 calculations with working and tolerances',
        sortOrder: 3,
        active: true,
        subtopics: [
          { id: 'sub-crcl', categoryId: 'cat-calc', name: 'Cockcroft-Gault Creatinine Clearance & Dosing', code: 'crcl-dosing', description: 'Target body weight vs actual weight renal adjustment', sortOrder: 0, active: true },
          { id: 'sub-infusions', categoryId: 'cat-calc', name: 'IV Infusion Rates, Drop Rates & Displacements', code: 'iv-infusions', description: 'Micrograms/kg/min conversions, reconstitution displacement volumes', sortOrder: 1, active: true },
        ],
      },
    ],
  },
];

export function CurriculumManager() {
  const [pathwaysList, setPathwaysList] = useState<Pathway[]>(SEED_CURRICULUM);
  const [expandedPathways, setExpandedPathways] = useState<Record<string, boolean>>({ 'p-mpharm': true });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ 'cat-cv': true });

  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'pathway' | 'category' | 'subtopic';
    data: any;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const togglePathway = (id: string) => {
    setExpandedPathways((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (type: 'pathway' | 'category' | 'subtopic', data: any) => {
    setSelectedEntity({ type, data });
    setEditName(data.name);
    setEditCode(data.code);
    setEditDescription(data.description || '');
    setIsEditing(false);
  };

  const handleToggleArchive = () => {
    if (!selectedEntity) return;
    const newActive = !selectedEntity.data.active;

    setPathwaysList((prev) =>
      prev.map((p) => {
        if (selectedEntity.type === 'pathway' && p.id === selectedEntity.data.id) {
          return { ...p, active: newActive };
        }
        return {
          ...p,
          categories: p.categories.map((c) => {
            if (selectedEntity.type === 'category' && c.id === selectedEntity.data.id) {
              return { ...c, active: newActive };
            }
            return {
              ...c,
              subtopics: c.subtopics.map((s) => {
                if (selectedEntity.type === 'subtopic' && s.id === selectedEntity.data.id) {
                  return { ...s, active: newActive };
                }
                return s;
              }),
            };
          }),
        };
      })
    );

    setSelectedEntity((prev) => (prev ? { ...prev, data: { ...prev.data, active: newActive } } : null));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;

    setPathwaysList((prev) =>
      prev.map((p) => {
        if (selectedEntity.type === 'pathway' && p.id === selectedEntity.data.id) {
          return { ...p, name: editName, code: editCode, description: editDescription };
        }
        return {
          ...p,
          categories: p.categories.map((c) => {
            if (selectedEntity.type === 'category' && c.id === selectedEntity.data.id) {
              return { ...c, name: editName, code: editCode, description: editDescription };
            }
            return {
              ...c,
              subtopics: c.subtopics.map((s) => {
                if (selectedEntity.type === 'subtopic' && s.id === selectedEntity.data.id) {
                  return { ...s, name: editName, code: editCode, description: editDescription };
                }
                return s;
              }),
            };
          }),
        };
      })
    );

    setSelectedEntity((prev) =>
      prev ? { ...prev, data: { ...prev.data, name: editName, code: editCode, description: editDescription } } : null
    );
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo/10 text-indigo">
              <FolderTree className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Curriculum Hierarchy Manager</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Manage pathways, clinical categories, and subtopics. Items can be archived without deleting attempt histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1">
            Single System of Record (D1)
          </Badge>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Tree */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 bg-surface border-border shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <span className="text-xs font-semibold text-slate uppercase tracking-wider">
                Hierarchy Tree (Pathway ➔ Category ➔ Subtopic)
              </span>
              <span className="text-xs text-slate">
                {pathwaysList.reduce((acc, p) => acc + p.categories.reduce((cAcc, c) => cAcc + c.subtopics.length, 0), 0)} Subtopics
              </span>
            </div>

            <div className="space-y-2">
              {pathwaysList.map((pathway) => (
                <div key={pathway.id} className="space-y-1">
                  {/* Pathway Row */}
                  <div
                    onClick={() => handleSelect('pathway', pathway)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                      selectedEntity?.data?.id === pathway.id
                        ? 'bg-indigo/10 border-indigo text-ink shadow-sm'
                        : 'hover:bg-canvas border-transparent text-ink'
                    } ${!pathway.active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePathway(pathway.id);
                        }}
                        className="p-1 rounded hover:bg-surface text-slate focus:outline-none"
                      >
                        {expandedPathways[pathway.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <Layers className="w-4 h-4 text-indigo shrink-0" />
                      <span className="font-semibold text-sm truncate">{pathway.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pathway.active && <Badge variant="warning">Archived</Badge>}
                      <Badge variant="outline">{pathway.code}</Badge>
                    </div>
                  </div>

                  {/* Categories */}
                  {expandedPathways[pathway.id] && (
                    <div className="pl-6 space-y-1 border-l-2 border-border/40 ml-4 mt-1">
                      {pathway.categories.map((category) => (
                        <div key={category.id} className="space-y-1">
                          {/* Category Row */}
                          <div
                            onClick={() => handleSelect('category', category)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                              selectedEntity?.data?.id === category.id
                                ? 'bg-indigo/10 border-indigo text-ink shadow-sm'
                                : 'hover:bg-canvas border-transparent text-ink'
                            } ${!category.active ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(category.id);
                                }}
                                className="p-1 rounded hover:bg-surface text-slate focus:outline-none"
                              >
                                {expandedCategories[category.id] ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <BookOpen className="w-4 h-4 text-teal shrink-0" />
                              <span className="font-medium text-sm truncate">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!category.active && <Badge variant="warning">Archived</Badge>}
                              <span className="text-xs text-slate font-mono">{category.subtopics.length} sub</span>
                            </div>
                          </div>

                          {/* Subtopics */}
                          {expandedCategories[category.id] && (
                            <div className="pl-6 space-y-1 border-l-2 border-border/40 ml-4 mt-1">
                              {category.subtopics.map((subtopic) => (
                                <div
                                  key={subtopic.id}
                                  onClick={() => handleSelect('subtopic', subtopic)}
                                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                                    selectedEntity?.data?.id === subtopic.id
                                      ? 'bg-indigo/10 border-indigo text-ink shadow-sm'
                                      : 'hover:bg-canvas border-transparent text-slate hover:text-ink'
                                  } ${!subtopic.active ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo shrink-0" />
                                    <span className="text-xs font-medium truncate">{subtopic.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {!subtopic.active && <Badge variant="warning">Archived</Badge>}
                                    <span className="text-[10px] text-slate font-mono bg-canvas px-1.5 py-0.5 rounded border border-border">
                                      {subtopic.code}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Selected Entity Details & Edit Panel */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEntity ? (
            <Card className="p-5 bg-surface border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedEntity.type}
                  </Badge>
                  <h2 className="font-bold text-ink text-base truncate">{selectedEntity.data.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </div>

              {!isEditing ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate block font-medium">Identifier Code</span>
                    <span className="font-mono text-xs text-ink bg-canvas px-2 py-1 rounded border border-border inline-block mt-0.5">
                      {selectedEntity.data.code}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate block font-medium">Clinical Description</span>
                    <p className="text-slate text-xs mt-0.5 leading-relaxed">
                      {selectedEntity.data.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate block font-medium">Lifecycle Status</span>
                      <span className="text-xs font-semibold text-ink">
                        {selectedEntity.data.active ? 'Active & Published' : 'Archived (Hidden from Session Builder)'}
                      </span>
                    </div>
                    <Button
                      variant={selectedEntity.data.active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={handleToggleArchive}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      {selectedEntity.data.active ? (
                        <>
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm rounded-input border border-border bg-canvas text-ink focus:ring-2 focus:ring-indigo outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate block mb-1">Code / Slug</label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-sm rounded-input border border-border bg-canvas text-ink font-mono focus:ring-2 focus:ring-indigo outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate block mb-1">Clinical Scope & Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-1.5 text-sm rounded-input border border-border bg-canvas text-ink focus:ring-2 focus:ring-indigo outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center bg-surface border-border border-dashed flex flex-col items-center justify-center">
              <FolderTree className="w-10 h-10 text-slate/40 mb-3" />
              <h3 className="font-semibold text-ink text-sm">Select an item in the hierarchy</h3>
              <p className="text-xs text-slate mt-1 max-w-xs">
                Click any pathway, category, or subtopic on the left to edit clinical scope, code, or archive status.
              </p>
            </Card>
          )}

          {/* Quick Rules Card */}
          <Card className="p-4 bg-indigo/5 border border-indigo/20 text-xs text-slate space-y-1.5">
            <span className="font-semibold text-indigo block text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Non-Negotiable Content Rules
            </span>
            <p>
              • <strong>Archive without delete</strong>: Archiving a subtopic hides it from new practice sessions while preserving all learner attempt histories and calibration accuracy.
            </p>
            <p>
              • <strong>Primary vs Secondary subtopics</strong>: Every question has exactly one primary subtopic. Category coverage is strictly counted by primary subtopics only.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
