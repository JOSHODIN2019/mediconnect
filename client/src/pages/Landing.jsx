import { Link } from 'react-router-dom'
import { Button, Badge } from '@/components/ui'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

/* ── Pexels free image IDs (African / Nigerian medical professionals) ── */
const IMG = {
  /* Hero: Black doctor consulting Black patient via video call on laptop */
  heroConsult:   '/hero-consultation.jpeg',
  consultPatient:'https://images.pexels.com/photos/4989132/pexels-photo-4989132.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  doctorF1:  'https://images.pexels.com/photos/5452224/pexels-photo-5452224.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  doctorM1:  'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  doctorF2:  'https://images.pexels.com/photos/4989134/pexels-photo-4989134.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  patient1:  'https://images.pexels.com/photos/4989132/pexels-photo-4989132.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  patient2:  'https://images.pexels.com/photos/7580257/pexels-photo-7580257.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
  team1:     'https://images.pexels.com/photos/5234487/pexels-photo-5234487.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
  team2:     'https://images.pexels.com/photos/4989139/pexels-photo-4989139.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop',
  ward:      'https://images.pexels.com/photos/4989171/pexels-photo-4989171.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop',
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DoctorsSection />
      <HowItWorksSection />
      <RolesSection />
      <CtaSection />
      <Footer />
    </div>
  )
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT — Text */}
          <div className="space-y-8 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Serving Rural Communities in Edo State, Nigeria
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl lg:text-[3.5rem] font-bold text-neutral-900 leading-[1.1] tracking-tight">
                Quality Healthcare,<br />
                Without the<br />
                <span className="text-blue-600">Long Journey.</span>
              </h1>
              <p className="text-lg text-neutral-500 leading-relaxed max-w-md">
                MediConnect connects rural Edo State patients with licensed doctors through secure video consultations — eliminating travel burdens, delays, and the high costs of seeking care far from home.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Book a Free Consultation <Arrow />
                </Button>
              </Link>
              <Link to="/login/patient">
                <Button size="lg" variant="outline">Patient Login</Button>
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex -space-x-2.5">
                {[IMG.patient1, IMG.doctorF1, IMG.doctorM1, IMG.doctorF2].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Medical professional"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">2,000+ Consultations Completed</p>
                <p className="text-xs text-neutral-400">Trusted by patients across rural Edo State</p>
              </div>
            </div>
          </div>

          {/* RIGHT — Black doctor consulting Black patient on laptop */}
          <div className="relative order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-[560px]">

              {/* Main photo */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-50">
                <img
                  src={IMG.heroConsult}
                  alt="Black doctor consulting a Black patient via video call on laptop"
                  className="w-full object-cover object-center"
                />
                {/* Subtle dark gradient at bottom for badge legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-transparent" />

                {/* Bottom overlay — location + live indicator */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex items-center gap-1.5 bg-neutral-900/70 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-xl">
                    <LocationPin />
                    Igueben, Edo State · Rural Area
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live Session
                  </div>
                </div>
              </div>

              {/* Top-right floating — HD Video badge */}
              <div className="absolute -top-4 -right-4 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <VideoSmallIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">HD Video</p>
                    <p className="text-xs text-neutral-400">Works on 3G</p>
                  </div>
                </div>
              </div>

              {/* Left-side floating — travel saved badge */}
              <div className="absolute top-1/3 -left-5 -translate-y-1/2 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <TravelIcon />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">4h+ Saved</p>
                    <p className="text-xs text-neutral-400">No travel needed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: '4h+',    label: 'Travel Time Saved',         sub: 'Per consultation, on average'      },
    { value: '150+',   label: 'Licensed Doctors',           sub: 'Verified & credentialed'          },
    { value: '85%',    label: 'Reduction in Care Costs',    sub: 'vs. travelling to city hospital'  },
    { value: '24/7',   label: 'Access to Care',             sub: 'Not limited to hospital hours'    },
  ]

  return (
    <section className="bg-neutral-50 border-y border-neutral-100">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Side image */}
          <div className="flex-shrink-0 hidden lg:block">
            <div className="relative">
              <img
                src={IMG.team1}
                alt="Nigerian healthcare team"
                className="w-48 h-56 object-cover rounded-2xl shadow-lg"
              />
              <img
                src={IMG.team2}
                alt="Nigerian healthcare professional"
                className="absolute -bottom-4 -right-6 w-32 h-40 object-cover rounded-xl shadow-xl border-4 border-white"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-8">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Measured Impact</p>
              <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                Bridging the healthcare gap for<br />rural communities in Edo State.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(({ value, label, sub }) => (
                <div key={label}>
                  <p className="text-4xl font-bold text-neutral-900 tracking-tight">{value}</p>
                  <p className="text-sm font-semibold text-neutral-700 mt-1">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: <LowBandwidthIcon />,
      title: 'Works on Slow Internet',
      desc: 'Optimized for 2G/3G connections common in rural Edo State. Video quality adapts automatically to your connection — no dropped consultations.',
      badge: '2G/3G Ready', variant: 'primary',
    },
    {
      icon: <SimpleUseIcon />,
      title: 'Designed for Everyone',
      desc: 'Built for all digital literacy levels. Book a consultation in three simple steps — no technical experience required.',
      badge: 'Easy to Use', variant: 'success',
    },
    {
      icon: <CalendarIcon />,
      title: 'Same-Day Appointments',
      desc: 'No more waiting weeks for a hospital slot or traveling hours to the city. Book and see a doctor the same day, from home.',
      badge: 'No Wait', variant: 'info',
    },
    {
      icon: <PrescriptionIcon />,
      title: 'Digital Prescriptions',
      desc: 'Doctors issue verified digital prescriptions directly to your patient record — accessible any time, no paper needed.',
      badge: 'Verified', variant: 'purple',
    },
    {
      icon: <SavingsIcon />,
      title: 'Eliminate Travel Costs',
      desc: 'Rural patients spend up to ₦15,000 per hospital trip on transport alone. MediConnect reduces that cost to zero.',
      badge: 'Cost Saving', variant: 'warning',
    },
    {
      icon: <RoleIcon />,
      title: 'Role-Based Portals',
      desc: 'Dedicated dashboards for Patients, Doctors, and Administrators — each role sees exactly what they need, nothing more.',
      badge: '3 Portals', variant: 'neutral',
    },
  ]

  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">Platform Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Built around the real constraints<br className="hidden md:block" /> of rural Nigerian healthcare
          </h2>
          <p className="text-neutral-500 mt-4 max-w-xl mx-auto">
            Every feature addresses a documented barrier — poor connectivity, digital literacy gaps, long travel distances, and high costs — faced by patients in rural Edo State.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc, badge, variant }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-neutral-200 bg-white hover:border-blue-200 hover:shadow-[0_8px_24px_rgb(37,99,235,0.08)] transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-300">
                {icon}
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                <Badge variant={variant} size="sm">{badge}</Badge>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   DOCTORS SHOWCASE
───────────────────────────────────────────── */
function DoctorsSection() {
  const doctors = [
    {
      name: 'Dr. Adaeze Nwosu',
      specialty: 'Cardiologist',
      hospital: 'LUTH, Lagos',
      img: IMG.doctorF1,
    },
    {
      name: 'Dr. Emeka Okafor',
      specialty: 'General Practitioner',
      hospital: 'UCH, Ibadan',
      img: IMG.doctorM1,
    },
    {
      name: 'Dr. Fatima Bello',
      specialty: 'Paediatrician',
      hospital: 'ABUTH, Zaria',
      img: IMG.doctorF2,
    },
    {
      name: 'Dr. Chukwuma Eze',
      specialty: 'Dermatologist',
      hospital: 'UNTH, Enugu',
      img: IMG.team2,
    },
  ]

  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top: wide hospital image */}
        <div className="relative rounded-3xl overflow-hidden h-52 md:h-64 mb-14 shadow-lg">
          <img
            src={IMG.ward}
            alt="Nigerian hospital ward"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/40 to-transparent flex items-center px-10">
            <div>
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-2">Our Doctor Network</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                Specialists from across Nigeria,<br className="hidden md:block" /> now reachable from rural Edo State
              </h2>
              <p className="text-neutral-300 text-sm mt-2 max-w-sm">
                No need to travel to Benin City or Lagos for specialist care. Connect with verified doctors from your community.
              </p>
            </div>
          </div>
        </div>

        {/* Doctor cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {doctors.map(({ name, specialty, hospital, img }) => (
            <div key={name} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] transition-all duration-300 group">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/50 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-semibold bg-white/90 text-blue-700 px-2 py-0.5 rounded-full">
                    {specialty}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-neutral-900">{name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{hospital}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      desc: 'Register in minutes using your phone or any device. No complex steps — just your name, contact, and basic health information. Designed to work for everyone.',
      icon: <RegisterIcon />,
    },
    {
      number: '02',
      title: 'Book Without Travelling',
      desc: 'Browse available doctors by specialty and book an appointment from home. No transport costs, no long queues, no lost days. Pick a time that works for you.',
      icon: <BookIcon />,
    },
    {
      number: '03',
      title: 'Consult & Receive Care',
      desc: 'Connect with your doctor via secure video from anywhere in Edo State. Get a diagnosis, digital prescription, and follow-up plan — all without leaving your community.',
      icon: <ConsultIcon />,
    },
  ]

  return (
    <section id="how" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="neutral" className="mb-4">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Quality care in three simple steps
          </h2>
          <p className="text-neutral-500 mt-4 max-w-lg mx-auto">
            No technical expertise required. MediConnect is designed to be as straightforward as a phone call — even for first-time users.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[calc(16.7%+1.5rem)] right-[calc(16.7%+1.5rem)] h-px bg-neutral-200 z-0" />
          {steps.map(({ number, title, desc, icon }, i) => (
            <div key={number} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-[0_4px_12px_rgb(0,0,0,0.06)] flex items-center justify-center mb-6 relative">
                {icon}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   ROLES
───────────────────────────────────────────── */
function RolesSection() {
  const roles = [
    {
      role: 'Patient',
      headerImg: IMG.patient2,
      accentColor: 'bg-blue-600',
      borderColor: 'border-blue-100',
      capabilities: [
        'Self-register from anywhere in Edo State',
        'Book consultations without travelling',
        'Connect via secure video call',
        'Receive digital prescriptions',
        'Access your full health history',
      ],
      cta: 'Register as Patient',
      href: '/register',
      loginHref: '/login/patient',
      loginLabel: 'Already registered? Log in',
      variant: 'primary',
    },
    {
      role: 'Doctor',
      headerImg: IMG.doctorF1,
      accentColor: 'bg-emerald-600',
      borderColor: 'border-emerald-100',
      capabilities: [
        'Reach rural patients across Edo State',
        'Manage your availability & schedule',
        'Conduct secure video consultations',
        'Issue digital prescriptions',
        'View patient medical history',
      ],
      cta: 'Doctor Login',
      href: '/login/doctor',
      loginHref: null,
      loginLabel: null,
      variant: 'success',
    },
    {
      role: 'Administrator',
      headerImg: IMG.doctorM1,
      accentColor: 'bg-purple-600',
      borderColor: 'border-purple-100',
      capabilities: [
        'Approve and manage doctor accounts',
        'Oversee all platform users',
        'View consultation analytics',
        'Manage platform settings',
        'Monitor activity logs',
      ],
      cta: 'Admin Login',
      href: '/login/admin',
      loginHref: null,
      loginLabel: null,
      variant: 'outline',
    },
  ]

  return (
    <section id="roles" className="py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="purple" className="mb-4">User Portals</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Built for every stakeholder
          </h2>
          <p className="text-neutral-500 mt-4 max-w-lg mx-auto">
            Three dedicated portals — each role gets exactly the tools and permissions their position requires.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map(({ role, headerImg, accentColor, borderColor, capabilities, cta, href, loginHref, loginLabel, variant }) => (
            <div
              key={role}
              className={`rounded-2xl border ${borderColor} bg-white overflow-hidden flex flex-col hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] transition-all duration-300`}
            >
              {/* Photo header */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={headerImg}
                  alt={role}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${accentColor}`}>
                    {role}
                  </span>
                </div>
              </div>

              <div className="px-5 py-5 flex-1">
                <ul className="space-y-2.5">
                  {capabilities.map(cap => (
                    <li key={cap} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm text-neutral-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 pb-5 space-y-2">
                <Link to={href}>
                  <Button variant={variant} fullWidth size="md">
                    {cta} <Arrow />
                  </Button>
                </Link>
                {loginHref && (
                  <Link to={loginHref} className="block text-center text-xs text-neutral-400 hover:text-blue-600 transition-colors py-1">
                    {loginLabel}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA BANNER
───────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="py-24 bg-neutral-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-neutral-300 px-4 py-2 rounded-full text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Free to Join · Academic Research Project
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
              No more long journeys<br />for a doctor's appointment.
            </h2>
            <p className="text-neutral-400 leading-relaxed">
              Quality medical care for rural Edo State patients — from your phone, from your home, on your schedule. The distance to your nearest doctor just became zero.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary">Register Free <Arrow /></Button>
              </Link>
              <Link to="/login/patient">
                <Button size="lg" className="border border-neutral-700 text-neutral-300 hover:bg-neutral-800 bg-transparent">Patient Login</Button>
              </Link>
            </div>
          </div>

          {/* Right: stacked photos */}
          <div className="hidden md:flex items-end gap-4 justify-end">
            <img
              src={IMG.patient1}
              alt="Rural patient in Edo State"
              className="w-36 h-48 object-cover rounded-2xl shadow-2xl mb-6"
            />
            <img
              src={IMG.doctorF2}
              alt="Nigerian doctor"
              className="w-44 h-60 object-cover rounded-2xl shadow-2xl"
            />
            <img
              src={IMG.team1}
              alt="Nigerian medical professional"
              className="w-36 h-48 object-cover rounded-2xl shadow-2xl mb-6"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 7h10M8 4l4 3-4 3" />
    </svg>
  )
}
function LocationPin() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
      <path d="M5 1a3 3 0 013 3c0 2-3 5-3 5S2 6 2 4a3 3 0 013-3z"/>
      <circle cx="5" cy="4" r="1"/>
    </svg>
  )
}
function VideoSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
      <path d="M9 5.5l4-2v7l-4-2V5.5z" fill="white" fillOpacity="0.9"/>
    </svg>
  )
}
function TravelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="14" r="1.5"/><circle cx="13" cy="14" r="1.5"/>
      <path d="M1 10l2-6h10l2 6H1z"/><path d="M5 7V4M9 7V3M13 7V4"/>
    </svg>
  )
}
function LowBandwidthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 14c0 0 2-3 9-3s9 3 9 3"/>
      <path d="M4 11c0 0 1.5-2 6-2s6 2 6 2"/>
      <path d="M7 8.5c0 0 .8-1 3-1s3 1 3 1"/>
      <circle cx="10" cy="15.5" r="1" fill="#2563eb"/>
    </svg>
  )
}
function SimpleUseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8"/>
      <path d="M7 10l2 2 4-4"/>
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="16" rx="2"/>
      <path d="M2 8h16M6 1v4M14 1v4"/>
    </svg>
  )
}
function PrescriptionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
      <path d="M8 8h1v5M8 10.5h2.5"/>
    </svg>
  )
}
function SavingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z"/>
      <path d="M10 6v8M7.5 8.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.4-1.1 1.5-2.5 1.5s-2.5.6-2.5 2 1.1 2 2.5 2 2.5-1.1 2.5-2"/>
    </svg>
  )
}
function RoleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="8" r="2.5"/><circle cx="14" cy="8" r="2.5"/>
      <path d="M1 17c0-2.5 2-4 5-4M14 13c3 0 5 1.5 5 4"/><path d="M9 17c0-2.8 2.2-5 5-5"/>
    </svg>
  )
}
function RegisterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4"/><path d="M2 20c0-4 3.6-7 8-7"/>
      <path d="M18 14v6M15 17h6"/>
    </svg>
  )
}
function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M3 9h18M8 2v4M16 2v4M9 14h1v4M9 16h3"/>
    </svg>
  )
}
function ConsultIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="14" height="12" rx="2"/>
      <path d="M16 9l6-3v10l-6-3V9z"/>
      <path d="M7 19l2-3H9M9 22H6"/>
    </svg>
  )
}
