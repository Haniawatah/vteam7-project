import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, login } from '../../services/auth';
import './Login.css';

// Enkel, egen SVG-illustration (3 figurer) där pupillerna följer musen.
// OBS: Inga “kända” karaktärer – bara generiska former.
const CharacterScene: React.FC<{ wrongTick: number }> = ({ wrongTick }) => {
    const wrapRef = useRef<HTMLDivElement | null>(null);

    // "blickpunkt" i SVG-koordinater (viewBox)
    const [lookAt, setLookAt] = useState<{ x: number; y: number } | null>(null);

    // Reaktion: skaka + sur min vid fel inlogg
    const [shake, setShake] = useState(false);
    const [sad, setSad] = useState(false);

    const viewBox = useMemo(() => ({ w: 900, h: 600 }), []);
    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

    useEffect(() => {
        // Global lyssnare: ögonen ska följa musen oavsett var den är på sidan
        let raf = 0;

        const onMove = (e: PointerEvent) => {
            const el = wrapRef.current;
            if (!el) return;

            const r = el.getBoundingClientRect();

            // Normalisera musen relativt vänsterdelen
            // Om musen är utanför -> clamp till närmsta kant
            const nx = clamp01((e.clientX - r.left) / r.width);
            const ny = clamp01((e.clientY - r.top) / r.height);

            // Mappa till SVG viewBox-koordinater
            const x = nx * viewBox.w;
            const y = ny * viewBox.h;

            // Throttle med rAF så attdet känns mjukt
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setLookAt({ x, y }));
        };

        window.addEventListener('pointermove', onMove, { passive: true });

        return () => {
            window.removeEventListener('pointermove', onMove);
            cancelAnimationFrame(raf);
        };
    }, [viewBox.w, viewBox.h]);

    useEffect(() => {
        // När wrongTick ändras: skaka huvudet + byt till sur min en kort stund
        if (!wrongTick) return;

        setShake(false);
        setSad(false);

        // nästa tick så animationen startar om även om man klickar snabbt
        const t0 = window.setTimeout(() => {
            setShake(true);
            setSad(true);
        }, 0);

        const t1 = window.setTimeout(() => {
            setShake(false);
            setSad(false);
        }, 700);

        return () => {
            window.clearTimeout(t0);
            window.clearTimeout(t1);
        };
    }, [wrongTick]);

    const pupilPos = (cx: number, cy: number) => {
        // Pupillen får röra sig lite inom ögat
        const maxR = 7;
        if (!lookAt) return { x: cx, y: cy };

        const dx = lookAt.x - cx;
        const dy = lookAt.y - cy;
        const len = Math.hypot(dx, dy) || 1;

        // Skala ner rörelsen + clampa inom maxR
        const k = Math.min(maxR, (len / 120) * maxR);
        return { x: cx + (dx / len) * k, y: cy + (dy / len) * k };
    };

    return (
        <div
            ref={wrapRef}
            className="auth-left"
        >
            <div className="auth-left__headline">
                <div className="auth-left__brand">Svenska Elsparkcyklar AB</div>
                <div className="auth-left__sub">
                    Välkommen tillbaka. Figurerna “tittar” där du pekar.
                </div>
            </div>

            <svg
                className="auth-left__svg"
                viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
                role="img"
                aria-label="Tre tecknade scootrar som tittar på muspekaren"
            >
                {/* ...existing code... */}
                <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#eef2ff" />
                        <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    {/* Mjuk skugga så scootrarna ser mindre “platta” ut */}
                    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#111827" floodOpacity="0.16" />
                    </filter>
                </defs>
                <rect x="0" y="0" width={viewBox.w} height={viewBox.h} fill="url(#bg)" />

                {/* ...existing code (mus-ikon i mitten)... */}

                {/* Scooter A (vänster) */}
                <g className={shake ? 'char-shake' : ''} filter="url(#softShadow)">
                    {/* Skärmar */}
                    <path d="M150 395 q40 -35 80 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />
                    <path d="M275 395 q40 -35 80 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />

                    {/* Hjul */}
                    <circle cx="190" cy="420" r="28" fill="#111827" opacity="0.88" />
                    <circle cx="330" cy="420" r="28" fill="#111827" opacity="0.88" />
                    <circle cx="190" cy="420" r="14" fill="#e5e7eb" />
                    <circle cx="330" cy="420" r="14" fill="#e5e7eb" />

                    {/* Deck (lite mer scooter-form) */}
                    <path
                        d="M160 404 h190 q26 0 26 18 v6 q0 10 -10 10 h-228 q-10 0 -10 -10 v-6 q0 -18 32 -18 z"
                        fill="#111827"
                        opacity="0.88"
                    />
                    <path d="M170 409 h165 q22 0 22 12 v2" stroke="#ffffff" strokeWidth="3" opacity="0.12" strokeLinecap="round" />

                    {/* Stem + framgaffel (lite lutning) */}
                    <path d="M330 404 L308 320" stroke="#374151" strokeWidth="12" strokeLinecap="round" />
                    <path d="M308 320 L300 290" stroke="#374151" strokeWidth="12" strokeLinecap="round" />

                    {/* Styre + handtag */}
                    <rect x="265" y="275" width="90" height="12" rx="6" fill="#374151" />
                    <rect x="257" y="273" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />
                    <rect x="349" y="273" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />

                    {/* Display / ansikte (centrerat på ögonkoordinaterna 215/285) */}
                    <rect x="175" y="210" width="150" height="86" rx="18" fill="#fde68a" opacity="0.95" />
                    <rect x="182" y="217" width="136" height="72" rx="16" fill="#ffffff" opacity="0.32" />

                    {/* Ögon */}
                    <g>
                        <circle cx="215" cy="250" r="18" fill="#fff" />
                        <circle cx="285" cy="250" r="18" fill="#fff" />
                        {(() => {
                            const p1 = pupilPos(215, 250);
                            const p2 = pupilPos(285, 250);
                            return (
                                <>
                                    <circle cx={p1.x} cy={p1.y} r="7" fill="#111827" />
                                    <circle cx={p2.x} cy={p2.y} r="7" fill="#111827" />
                                </>
                            );
                        })()}
                    </g>

                    {/* Display-lampa: normal grön / fel röd */}
                    {!sad ? (
                        <rect x="238" y="296" width="24" height="8" rx="4" fill="#22c55e" opacity="0.85" />
                    ) : (
                        <>
                            <rect x="238" y="296" width="24" height="8" rx="4" fill="#ef4444" opacity="0.95" />
                            <path d="M241 294 L259 306 M259 294 L241 306" stroke="#111827" strokeWidth="2.5" opacity="0.6" />
                        </>
                    )}

                    {/* Liten “strålkastare” fram */}
                    <circle cx="370" cy="410" r="7" fill="#fde68a" opacity="0.95" />
                    <circle cx="370" cy="410" r="12" fill="#fde68a" opacity="0.22" />
                </g>

                {/* Scooter B (mitten) */}
                <g className={shake ? 'char-shake' : ''} filter="url(#softShadow)">
                    {/* Skärmar */}
                    <path d="M400 375 q38 -32 76 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />
                    <path d="M525 375 q38 -32 76 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />

                    {/* Hjul */}
                    <circle cx="440" cy="395" r="26" fill="#111827" opacity="0.88" />
                    <circle cx="580" cy="395" r="26" fill="#111827" opacity="0.88" />
                    <circle cx="440" cy="395" r="13" fill="#e5e7eb" />
                    <circle cx="580" cy="395" r="13" fill="#e5e7eb" />

                    {/* Deck */}
                    <path
                        d="M412 380 h192 q24 0 24 16 v6 q0 10 -10 10 h-220 q-10 0 -10 -10 v-6 q0 -16 34 -16 z"
                        fill="#111827"
                        opacity="0.88"
                    />

                    {/* Stem + styre */}
                    <path d="M580 380 L545 275" stroke="#374151" strokeWidth="12" strokeLinecap="round" />
                    <rect x="500" y="248" width="90" height="12" rx="6" fill="#374151" />
                    <rect x="492" y="246" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />
                    <rect x="584" y="246" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />

                    {/* Display (anpassad till ögon 465/535) */}
                    <rect x="425" y="175" width="150" height="86" rx="18" fill="#a7f3d0" opacity="0.95" />
                    <rect x="432" y="182" width="136" height="72" rx="16" fill="#ffffff" opacity="0.32" />

                    {/* Ögon */}
                    <g>
                        <circle cx="465" cy="220" r="18" fill="#fff" />
                        <circle cx="535" cy="220" r="18" fill="#fff" />
                        {(() => {
                            const p1 = pupilPos(465, 220);
                            const p2 = pupilPos(535, 220);
                            return (
                                <>
                                    <circle cx={p1.x} cy={p1.y} r="7" fill="#111827" />
                                    <circle cx={p2.x} cy={p2.y} r="7" fill="#111827" />
                                </>
                            );
                        })()}
                    </g>

                    {/* Display-lampa */}
                    {!sad ? (
                        <rect x="488" y="260" width="24" height="8" rx="4" fill="#22c55e" opacity="0.85" />
                    ) : (
                        <>
                            <rect x="488" y="260" width="24" height="8" rx="4" fill="#ef4444" opacity="0.95" />
                            <path d="M491 258 L509 270 M509 258 L491 270" stroke="#111827" strokeWidth="2.5" opacity="0.6" />
                        </>
                    )}

                    {/* Liten “strålkastare” */}
                    <circle cx="642" cy="386" r="7" fill="#a7f3d0" opacity="0.9" />
                    <circle cx="642" cy="386" r="12" fill="#a7f3d0" opacity="0.18" />
                </g>

                {/* Scooter C (höger) */}
                <g className={shake ? 'char-shake' : ''} filter="url(#softShadow)">
                    {/* Skärmar */}
                    <path d="M600 440 q44 -36 88 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />
                    <path d="M730 440 q44 -36 88 0" fill="none" stroke="#111827" strokeWidth="10" opacity="0.18" strokeLinecap="round" />

                    {/* Hjul */}
                    <circle cx="645" cy="460" r="30" fill="#111827" opacity="0.88" />
                    <circle cx="795" cy="460" r="30" fill="#111827" opacity="0.88" />
                    <circle cx="645" cy="460" r="15" fill="#e5e7eb" />
                    <circle cx="795" cy="460" r="15" fill="#e5e7eb" />

                    {/* Deck */}
                    <path
                        d="M600 445 h230 q26 0 26 18 v6 q0 10 -10 10 h-268 q-10 0 -10 -10 v-6 q0 -18 32 -18 z"
                        fill="#111827"
                        opacity="0.88"
                    />

                    {/* Stem + styre */}
                    <path d="M795 445 L740 320" stroke="#374151" strokeWidth="12" strokeLinecap="round" />
                    <rect x="695" y="292" width="90" height="12" rx="6" fill="#374151" />
                    <rect x="687" y="290" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />
                    <rect x="779" y="290" width="14" height="16" rx="6" fill="#111827" opacity="0.55" />

                    {/* Display (anpassad till ögon 665/735) */}
                    <rect x="625" y="250" width="150" height="96" rx="18" fill="#fecaca" opacity="0.95" />
                    <rect x="632" y="257" width="136" height="82" rx="16" fill="#ffffff" opacity="0.32" />

                    {/* Ögon */}
                    <g>
                        <circle cx="665" cy="300" r="18" fill="#fff" />
                        <circle cx="735" cy="300" r="18" fill="#fff" />
                        {(() => {
                            const p1 = pupilPos(665, 300);
                            const p2 = pupilPos(735, 300);
                            return (
                                <>
                                    <circle cx={p1.x} cy={p1.y} r="7" fill="#111827" />
                                    <circle cx={p2.x} cy={p2.y} r="7" fill="#111827" />
                                </>
                            );
                        })()}
                    </g>

                    {/* Display-lampa */}
                    {!sad ? (
                        <rect x="688" y="350" width="24" height="8" rx="4" fill="#22c55e" opacity="0.85" />
                    ) : (
                        <>
                            <rect x="688" y="350" width="24" height="8" rx="4" fill="#ef4444" opacity="0.95" />
                            <path d="M691 348 L709 360 M709 348 L691 360" stroke="#111827" strokeWidth="2.5" opacity="0.6" />
                        </>
                    )}

                    {/* Liten “strålkastare” */}
                    <circle cx="868" cy="452" r="8" fill="#fecaca" opacity="0.9" />
                    <circle cx="868" cy="452" r="14" fill="#fecaca" opacity="0.18" />
                </g>

                {/* Liten text */}
                <text x="24" y="570" fill="#111827" opacity="0.45" fontSize="14">
                    Tips: rör musen över vänstersidan så följer ögonen.
                </text>
            </svg>
        </div>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [wrongTick, setWrongTick] = useState(0); // triggar “fel-reaktion”
    const navigate = useNavigate();

    const googleAuthUrl = 'http://localhost:3000/v1/auth/google';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            const user = getStoredUser();
            navigate(user?.role === 'admin' ? '/admin' : '/');
        } catch (e: any) {
            const msg = String(e?.message ?? 'Login failed');

            // Enkel kontroll: vid 401 tolkar vi som "fel email/lösenord"
            if (msg.includes('401')) {
                setWrongTick((n) => n + 1);
                setError('Fel e-post eller lösenord.');
            } else {
                setError(msg);
            }
        }
    };

    const googleLogin = () => {
        window.location.href = googleAuthUrl;
    };

    return (
        <div className="auth-split">
            {/* Vänster sida: illustration + reaktion */}
            <CharacterScene wrongTick={wrongTick} />

            {/* Höger sida: login-form */}
            <div className="auth-right">
                <div className="auth-card">
                    <h2 className="auth-title">Logga in</h2>
                    <p className="auth-subtitle">Använd e-post och lösenord.</p>

                    {error && <p className="error">{error}</p>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div>
                            <label>E-post</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label>Lösenord</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit">Logga in</button>

                        {/* Viktigt: type="button" så den inte skickar formuläret */}
                        <button type="button" className="secondary" onClick={googleLogin}>
                            Fortsätt med Google
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;