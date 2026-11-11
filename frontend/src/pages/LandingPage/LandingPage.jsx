import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

const heroSlides = [
  '/landing%20image1.jpg',
  '/landing%20image2.jpg',
  '/landing%20image3.jpg',
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const slideTimer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 6500)

    return () => window.clearInterval(slideTimer)
  }, [])

  const handleNavClick = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand" aria-label="WorkSphere home">
            <div className="brand-mark">WS</div>
            <span className="brand-name">
              Work<strong>Sphere</strong>
            </span>
          </Link>

          <nav id="landing-navigation" className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <button type="button" onClick={() => handleNavClick('features')}>Features</button>
            <button type="button" onClick={() => handleNavClick('how-it-works')}>How It Works</button>
            <button type="button" onClick={() => handleNavClick('preview')}>App Preview</button>
            <button type="button" onClick={() => handleNavClick('security')}>Security</button>
            
            <div className="mobile-nav-actions">
              <Link to="/login" className="btn-ghost">Sign In</Link>
              <Link to="/login" className="btn-primary-nav">Get Started</Link>
            </div>
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/login" className="btn-primary-nav">Get Started</Link>
          </div>

          <button 
            type="button" 
            className="mobile-hamburger" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-navigation"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background" aria-hidden="true">
          <img key={heroSlides[activeHeroSlide]} src={heroSlides[activeHeroSlide]} alt="" />
          <div className="hero-background-overlay"></div>
        </div>
        
        <div className="landing-container hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            WorkSphere Platform • Enterprise Multi-Tenant Solution
          </div>

          <h1 className="hero-title">
            WorkSphere <br />
            <span className="gradient-text">Multi-Tenant Project Management Platform</span>
          </h1>

          <p className="hero-subtitle">
            Isolate company data, manage granular permissions, and streamline multi-tenant project administration seamlessly in one unified platform.
          </p>

          <div className="hero-cta-group">
            <Link to="/login" className="btn-hero-primary">
              Get Started Free
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <button type="button" onClick={() => handleNavClick('preview')} className="btn-hero-secondary">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Explore Live Preview
            </button>
          </div>

          <div className="hero-stats-grid">
            <div className="stat-card">
              <span className="stat-number">100%</span>
              <span className="stat-label">Tenant Scope Isolation</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">3-Tier</span>
              <span className="stat-label">Role-Based Authorization</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">Granular</span>
              <span className="stat-label">Per-User Permission Overrides</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">Instant</span>
              <span className="stat-label">Multi-Company Switching</span>
            </div>
          </div>
        </div>

        <div className="hero-slide-controls" role="group" aria-label="Choose hero background image">
          {heroSlides.map((slide, index) => (
            <button
              key={slide}
              type="button"
              className={`hero-slide-dot ${activeHeroSlide === index ? 'active' : ''}`}
              onClick={() => setActiveHeroSlide(index)}
              aria-label={`Show background image ${index + 1}`}
              aria-pressed={activeHeroSlide === index}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-tag">Powerful Capabilities</p>
            <h2 className="section-title">Designed for Modern Multi-Tenant Needs</h2>
            <p className="section-description">
              A comprehensive architecture ensuring complete security, flexibility, and operational efficiency for every company in your system.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Strict Tenant Isolation</h3>
              <p>
                Database queries are automatically bound to the caller's tenant ID, preventing data leakage across organizational boundaries.
              </p>
              <span className="feature-pill">Security First</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper indigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Hierarchical Role Management</h3>
              <p>
                Built-in SUPER_ADMIN, ADMIN, and AGENT roles define broad functional scopes for tenant users and global administrators.
              </p>
              <span className="feature-pill">Role-Based Access</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3>Agent Direct Permission Overrides</h3>
              <p>
                Grant individual Agents elevated project creation, editing, or deletion powers without inflating their role level.
              </p>
              <span className="feature-pill">Fine-Grained Controls</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper cyan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>Super Admin Tenant Picker</h3>
              <p>
                Super Admins switch tenant scopes effortlessly using explicit header parameters (`X-Tenant-Id`) for total auditing transparency.
              </p>
              <span className="feature-pill">Global Context</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Project Lifecycle Tracking</h3>
              <p>
                Track status across ACTIVE, INACTIVE, and DRAFT projects with search filtering, status toggles, and rich data tables.
              </p>
              <span className="feature-pill">Project Control</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3>Rate Limiting & Token Auth</h3>
              <p>
                API endpoint protection with IP-based rate limiting, JWT token verification, and bcrypt hashing for production readiness.
              </p>
              <span className="feature-pill">API Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-tag">Simple Operational Flow</p>
            <h2 className="section-title">How WorkSphere Works</h2>
            <p className="section-description">
              Streamline multi-tenant project administrative workflows in 3 effortless steps.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Provision & Scope Tenants</h3>
              <p>
                Super Admins create dedicated tenant companies (e.g. Acme Corp, TechNova). Each tenant operates in complete data isolation.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Assign Roles & Custom Permissions</h3>
              <p>
                Add Tenant Admins and Agents. Super Admins can grant individual Agents specific project permissions on demand.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Manage Projects Safely</h3>
              <p>
                Create, monitor, filter, and edit projects with guaranteed data integrity, auditability, and immediate permission enforcement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="preview" className="preview-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-tag">Live Interface Preview</p>
            <h2 className="section-title">Experience the Clean WorkSphere Console</h2>
            <p className="section-description">
              An intuitive interface tailored for speed, clarity, and instant multi-tenant administration.
            </p>
          </div>

          <div className="preview-window">
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="preview-url-bar">
                https://app.worksphere.io/workspace
              </div>
              <div className="preview-tenant-badge">
                Tenant: <strong>Acme Corp</strong>
              </div>
            </div>

            <div className="preview-tab-bar">
              <button 
                type="button" 
                className={`preview-tab ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                Projects Dashboard
              </button>
              <button 
                type="button" 
                className={`preview-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                User Administration
              </button>
              <button 
                type="button" 
                className={`preview-tab ${activeTab === 'permissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('permissions')}
              >
                Agent Permissions
              </button>
              <button 
                type="button" 
                className={`preview-tab ${activeTab === 'tenants' ? 'active' : ''}`}
                onClick={() => setActiveTab('tenants')}
              >
                Super Admin Tenant Picker
              </button>
            </div>

            <div className="preview-body">
              {activeTab === 'projects' && (
                <div className="preview-content-pane">
                  <div className="preview-toolbar">
                    <div className="preview-search">
                      <input type="text" readOnly value="Filter projects by name or status..." />
                    </div>
                    <button type="button" className="btn-mock-primary">+ New Project</button>
                  </div>

                  <div className="preview-table-mock">
                    <table>
                      <thead>
                        <tr>
                          <th>Project Name</th>
                          <th>Address</th>
                          <th>Use Case</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Skyline Commercial Hub</strong></td>
                          <td>101 Tech Boulevard, Suite 400</td>
                          <td>Commercial Real Estate</td>
                          <td><span className="status-tag active">ACTIVE</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text danger">Delete</span></div></td>
                        </tr>
                        <tr>
                          <td><strong>Metro Transit Expansion</strong></td>
                          <td>88 Central Avenue</td>
                          <td>Public Infrastructure</td>
                          <td><span className="status-tag draft">DRAFT</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text danger">Delete</span></div></td>
                        </tr>
                        <tr>
                          <td><strong>Logistics Depot B</strong></td>
                          <td>450 Industrial Parkway</td>
                          <td>Warehousing</td>
                          <td><span className="status-tag inactive">INACTIVE</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text danger">Delete</span></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="preview-content-pane">
                  <div className="preview-toolbar">
                    <div className="preview-search">
                      <input type="text" readOnly value="Search team users..." />
                    </div>
                    <button type="button" className="btn-mock-primary">+ Add User</button>
                  </div>

                  <div className="preview-table-mock">
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Sarah Jenkins</strong></td>
                          <td>sarah.j@acmecorp.com</td>
                          <td><span className="role-tag admin">ADMIN</span></td>
                          <td><span className="status-tag active">Active</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text">Disable</span></div></td>
                        </tr>
                        <tr>
                          <td><strong>Alex Rivera</strong></td>
                          <td>alex.r@acmecorp.com</td>
                          <td><span className="role-tag agent">AGENT</span></td>
                          <td><span className="status-tag active">Active</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text">Manage Direct Permissions</span></div></td>
                        </tr>
                        <tr>
                          <td><strong>David Miller</strong></td>
                          <td>david.m@acmecorp.com</td>
                          <td><span className="role-tag agent">AGENT</span></td>
                          <td><span className="status-tag inactive">Disabled</span></td>
                          <td><div className="preview-row-actions"><span className="action-text">Edit</span><span className="action-text">Enable</span></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="preview-content-pane">
                  <div className="preview-card-mock">
                    <div className="mock-card-header">
                      <h3>Agent Direct Permission Overrides</h3>
                      <p>Managing permissions for: <strong>Alex Rivera (AGENT)</strong></p>
                    </div>
                    <div className="permission-checkboxes-mock">
                      <label className="checkbox-mock checked">
                        <input type="checkbox" checked readOnly />
                        <div>
                          <strong>projects.create</strong>
                          <span>Allow creating new projects within Acme Corp</span>
                        </div>
                      </label>
                      <label className="checkbox-mock checked">
                        <input type="checkbox" checked readOnly />
                        <div>
                          <strong>projects.update</strong>
                          <span>Allow modifying existing project details</span>
                        </div>
                      </label>
                      <label className="checkbox-mock">
                        <input type="checkbox" readOnly />
                        <div>
                          <strong>projects.delete</strong>
                          <span>Allow deleting projects (Admin permission)</span>
                        </div>
                      </label>
                    </div>
                    <button type="button" className="btn-mock-primary" style={{ marginTop: '16px' }}>Save Agent Permissions</button>
                  </div>
                </div>
              )}

              {activeTab === 'tenants' && (
                <div className="preview-content-pane">
                  <div className="preview-card-mock">
                    <div className="mock-card-header">
                      <h3>Super Admin Company Selector</h3>
                      <p>Select a tenant scope to inspect and manage its projects and team members:</p>
                    </div>
                    <div className="tenant-list-mock">
                      <div className="tenant-item active">
                        <div className="tenant-item-info">
                          <strong>Acme Corp</strong>
                          <span>12 Projects • 8 Users</span>
                        </div>
                        <span className="selected-badge">Active Scope</span>
                      </div>
                      <div className="tenant-item">
                        <div className="tenant-item-info">
                          <strong>TechNova Solutions</strong>
                          <span>24 Projects • 15 Users</span>
                        </div>
                        <button type="button" className="btn-mock-secondary">Switch Scope</button>
                      </div>
                      <div className="tenant-item">
                        <div className="tenant-item-info">
                          <strong>Global Logistics Co.</strong>
                          <span>6 Projects • 4 Users</span>
                        </div>
                        <button type="button" className="btn-mock-secondary">Switch Scope</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security-section">
        <div className="landing-container">
          <div className="security-box">
            <div className="security-content">
              <div className="security-badge">Enterprise Security</div>
              <h2>Built with Defense-in-Depth Architecture</h2>
              <p>
                Our platform enforces strict tenant boundaries at the API middleware layer. Database queries are automatically wrapped with scoped tenant constraints, eliminating human error and preventing unauthorized data access.
              </p>

              <div className="security-features-list">
                <div className="security-item">
                  <div className="check-icon">✓</div>
                  <div>
                    <strong>JWT Token Verification</strong>
                    <p>Cryptographically signed bearer tokens with custom claims and expiration validation.</p>
                  </div>
                </div>
                <div className="security-item">
                  <div className="check-icon">✓</div>
                  <div>
                    <strong>PostgreSQL Prisma Isolation</strong>
                    <p>Relational foreign key guarantees (`onDelete: Restrict`) prevent orphan tenant records.</p>
                  </div>
                </div>
                <div className="security-item">
                  <div className="check-icon">✓</div>
                  <div>
                    <strong>IP Rate Limiting</strong>
                    <p>Protects authentication and REST API routes against brute-force credential stuffing.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="security-visual">
              <div className="shield-card">
                <div className="shield-icon">🛡️</div>
                <div className="shield-title">100% Tenant Isolation</div>
                <div className="shield-desc">Server-Side Middleware Scope Validation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="landing-container">
          <div className="final-cta-card">
            <h2>Start Managing Workspaces with WorkSphere Today</h2>
            <p>Experience seamless project control, granular authorization, and enterprise data security.</p>
            <div className="final-cta-buttons">
              <Link to="/login" className="btn-hero-primary">
                Access WorkSphere Workspace
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-grid">
          <div className="footer-col brand-col">
            <div className="landing-brand">
              <div className="brand-mark">WS</div>
              <span className="brand-name">Work<strong>Sphere</strong></span>
            </div>
            <p className="footer-tagline">
              WorkSphere — Multi-Tenant Project Management Platform with role-based and permission-based authorization.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><button type="button" onClick={() => handleNavClick('features')}>Features</button></li>
              <li><button type="button" onClick={() => handleNavClick('how-it-works')}>How It Works</button></li>
              <li><button type="button" onClick={() => handleNavClick('preview')}>Live Preview</button></li>
              <li><button type="button" onClick={() => handleNavClick('security')}>Security Architecture</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Access & Links</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/login">Workspace Login</Link></li>
              <li><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to Top</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Tech Stack</h4>
            <div className="tech-pills">
              <span>React</span>
              <span>Vite</span>
              <span>Node.js</span>
              <span>Express</span>
              <span>PostgreSQL</span>
              <span>Prisma ORM</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="landing-container footer-bottom-flex">
            <p>© {new Date().getFullYear()} WorkSphere — Multi-Tenant Project Management Platform. All rights reserved.</p>
            <p className="footer-demo-note">Demo Credentials available on Login page.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
