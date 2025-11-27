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
    <div className="min-h-screen p-6 md:p-12 relative">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Template Manager</h1>
            <p className="text-slate-400">Manage your face replacement templates</p>
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleLogout} icon="fas fa-sign-out-alt">Logout</Button>
            <Link to="/admin/add">
              <Button variant="primary" icon="fas fa-plus">
                Add New Template
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-32 glass-panel rounded-3xl border-dashed border-slate-700">
            <div className="text-indigo-500 mb-6 text-6xl animate-pulse"><i className="fas fa-circle-notch fa-spin"></i></div>
            <h3 className="text-2xl font-medium text-white">Loading templates...</h3>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-32 glass-panel rounded-3xl border-dashed border-slate-700">
            <div className="text-slate-600 mb-6 text-6xl"><i className="fas fa-images"></i></div>
            <h3 className="text-2xl font-medium text-white mb-2">No templates yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Create your first template to get started with the magic of AI face replacement.</p>
            <Link to="/admin/add">
              <Button variant="primary" icon="fas fa-magic">Create First Template</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.map((template) => (
              <div key={template.id} className="glass-panel rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group hover:-translate-y-1">
                <div className="relative h-64 bg-slate-800 checkerboard group-hover:opacity-90 transition-opacity">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-semibold text-lg truncate shadow-black drop-shadow-md">{template.name}</h3>
                    <p className="text-slate-300 text-xs mt-1 font-mono opacity-80 truncate">ID: {template.customId || template.id}</p>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 gap-3 bg-slate-900/50 backdrop-blur-sm">
                  <Button
                    variant={copiedId === template.id ? 'primary' : 'secondary'}
                    onClick={() => copyLink(template.id)}
                    className="text-sm w-full"
                    icon={copiedId === template.id ? 'fas fa-check' : 'fas fa-link'}
                  >
                    {copiedId === template.id ? 'Copied' : 'Link'}
                  </Button>

                  <Button variant="danger" onClick={() => handleDelete(template.id)} className="text-sm w-full" icon="fas fa-trash-alt">
                    Delete
                  </Button>

                  <Link to={`/template/${template.customId?.trim() ? template.customId.trim() : template.id}`} className="col-span-2">
                    <Button variant="ghost" className="w-full text-sm border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-300" icon="fas fa-eye">
                      Preview Template
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