import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTemplates, deleteTemplate } from '../../services/storageService';
import { Template } from '../../types';
import Button from '../../components/Button';

const Dashboard: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data.reverse()); // Newest first
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
      loadTemplates();
    }
  };

  const copyLink = (id: string) => {
    // robustly construct the link relative to the current path
    // this handles apps served from subdirectories (like GitHub pages) correctly
    const baseUrl = window.location.href.split('#')[0].replace(/\/$/, '');
    const template = templates.find(t => t.id === id);
    const linkId = template?.customId?.trim() ? template.customId.trim() : id;
    const url = `${baseUrl}/#/template/${linkId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_template_auth');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Template Manager</h1>
            <p className="text-slate-500 mt-1">Manage your face replacement templates</p>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" onClick={handleLogout}>Logout</Button>
             <Link to="/admin/add">
              <Button>
                <i className="fas fa-plus"></i> Add New Template
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-4 text-5xl"><i className="fas fa-spinner fa-spin"></i></div>
            <h3 className="text-xl font-medium text-slate-700">Loading templates...</h3>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-4 text-5xl"><i className="fas fa-images"></i></div>
            <h3 className="text-xl font-medium text-slate-700">No templates yet</h3>
            <p className="text-slate-500 mb-6">Create your first template to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-slate-200 checkerboard">
                  <img 
                    src={template.imageUrl} 
                    alt={template.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-medium truncate">{template.name}</h3>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={() => copyLink(template.id)} className="text-sm">
                    <i className="fas fa-link mr-1"></i> {copiedId === template.id ? 'Copied!' : 'Link'}
                  </Button>
                   <Button variant="danger" onClick={() => handleDelete(template.id)} className="text-sm">
                    <i className="fas fa-trash-alt mr-1"></i> Delete
                  </Button>
                  <Link to={`/template/${template.customId?.trim() ? template.customId.trim() : template.id}`} className="col-span-2">
                    <Button variant="primary" className="w-full text-sm">
                      <i className="fas fa-eye mr-1"></i> Preview
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;