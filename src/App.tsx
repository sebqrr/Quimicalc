import { useState } from 'react';
import './App.css';

// 1. Tipos de Pestañas
type TabType = 'ACIDO_FUERTE' | 'ACIDO_DEBIL' | 'BASE_FUERTE' | 'BASE_DEBIL' | 'LIBRE';

// 2. Interfaz para los pasos del cálculo
interface Step {
  formula: string;
  desc: string;
  math: string;
}

// 3. Interfaz para los resultados matemáticos
interface CalculationResults {
  ph: number;
  poh: number;
  h: number;
  oh: number;
  status: { text: string; color: string };
  steps: Step[];
}

// 4. Interfaz para solucionar el error de TypeScript con kLabel
interface TabConfig {
  title: string;
  subtitle: string;
  formulas: string[];
  hasC: boolean;
  hasK: boolean;
  hasPh: boolean;
  kLabel?: string; // El signo de interrogación lo hace opcional
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ACIDO_FUERTE');
  const [inputC, setInputC] = useState('');
  const [inputK, setInputK] = useState(''); 
  const [inputPh, setInputPh] = useState(''); 
  const [results, setResults] = useState<CalculationResults | null>(null);

  const Kw = 1e-14;

  const getPhStatus = (ph: number) => {
    if (ph < 3) return { text: "Muy ácido", color: "var(--res-orange)" };
    if (ph < 7) return { text: "Ácido", color: "var(--res-yellow)" };
    if (ph === 7) return { text: "Neutro", color: "var(--res-green)" };
    if (ph < 11) return { text: "Base", color: "var(--res-cyan)" };
    return { text: "Muy básico", color: "var(--blue-accent)" };
  };

  const handleCalculate = () => {
    let ph = 0, poh = 0, h = 0, oh = 0;
    const steps: Step[] = [];

    if (activeTab === 'LIBRE') {
      ph = parseFloat(inputPh);
      if (isNaN(ph) || ph < 0 || ph > 14) {
        alert("Ingresa un pH válido entre 0 y 14.");
        return;
      }
      poh = 14 - ph;
      h = Math.pow(10, -ph);
      oh = Math.pow(10, -poh);

      steps.push({ formula: "pOH = 14 - pH", desc: "Se despeja pOH restando el pH a 14.", math: `pOH = 14 - ${ph.toFixed(4)} = ${poh.toFixed(4)}` });
      steps.push({ formula: "[H⁺] = 10^(-pH)", desc: "Se calcula la concentración de iones hidrógeno elevando 10 a la -pH.", math: `[H⁺] = 10^(-${ph.toFixed(4)}) = ${h.toExponential(4)} M` });
      steps.push({ formula: "[OH⁻] = 10^(-pOH)", desc: "Se calcula la concentración de iones hidroxilo elevando 10 a la -pOH.", math: `[OH⁻] = 10^(-${poh.toFixed(4)}) = ${oh.toExponential(4)} M` });
    } 
    else {
      const C = parseFloat(inputC);
      if (isNaN(C) || C <= 0) {
        alert("Ingresa una concentración válida mayor a 0.");
        return;
      }

      if (activeTab === 'ACIDO_FUERTE') {
        h = C;
        ph = -Math.log10(h);
        poh = 14 - ph;
        oh = Kw / h;

        steps.push({ formula: "[H⁺] = C", desc: "Disociación completa (ácido fuerte).", math: `[H⁺] = ${C} M` });
        steps.push({ formula: "pH = -log₁₀[H⁺]", desc: "Cálculo del pH.", math: `pH = -log₁₀(${h.toExponential(4)}) = ${ph.toFixed(4)}` });
        steps.push({ formula: "pOH = 14 - pH", desc: "Suma constante de 14 a 25°C.", math: `pOH = 14 - ${ph.toFixed(4)} = ${poh.toFixed(4)}` });
        steps.push({ formula: "[OH⁻] = Kw / [H⁺]", desc: "Despeje de la autoionización del agua.", math: `[OH⁻] = 1e-14 / ${h.toExponential(4)} = ${oh.toExponential(4)} M` });
      } 
      else if (activeTab === 'BASE_FUERTE') {
        oh = C;
        poh = -Math.log10(oh);
        ph = 14 - poh;
        h = Kw / oh;

        steps.push({ formula: "[OH⁻] = C", desc: "Disociación completa (base fuerte).", math: `[OH⁻] = ${C} M` });
        steps.push({ formula: "pOH = -log₁₀[OH⁻]", desc: "Cálculo del pOH.", math: `pOH = -log₁₀(${oh.toExponential(4)}) = ${poh.toFixed(4)}` });
        steps.push({ formula: "pH = 14 - pOH", desc: "Suma constante de 14 a 25°C.", math: `pH = 14 - ${poh.toFixed(4)} = ${ph.toFixed(4)}` });
        steps.push({ formula: "[H⁺] = Kw / [OH⁻]", desc: "Despeje de la autoionización del agua.", math: `[H⁺] = 1e-14 / ${oh.toExponential(4)} = ${h.toExponential(4)} M` });
      } 
      else if (activeTab === 'ACIDO_DEBIL' || activeTab === 'BASE_DEBIL') {
        const K = parseFloat(inputK);
        if (isNaN(K) || K <= 0) {
          alert("Ingresa una constante de disociación válida mayor a 0.");
          return;
        }

        const x = (-K + Math.sqrt(Math.pow(K, 2) - 4 * 1 * (-K * C))) / 2;

        if (activeTab === 'ACIDO_DEBIL') {
          h = x;
          ph = -Math.log10(h);
          poh = 14 - ph;
          oh = Kw / h;

          steps.push({ formula: "Ka = [H⁺][A⁻] / [HA]", desc: "Fórmula cuadrática exacta (x² + Ka·x - Ka·C = 0) para encontrar [H⁺] sin aproximaciones.", math: `[H⁺] = ${h.toExponential(4)} M` });
          steps.push({ formula: "pH = -log₁₀[H⁺]", desc: "Cálculo del pH a partir del ión hidrógeno.", math: `pH = -log₁₀(${h.toExponential(4)}) = ${ph.toFixed(4)}` });
          steps.push({ formula: "pOH = 14 - pH", desc: "Diferencia respecto a 14.", math: `pOH = 14 - ${ph.toFixed(4)} = ${poh.toFixed(4)}` });
          steps.push({ formula: "[OH⁻] = Kw / [H⁺]", desc: "Concentración del ión hidroxilo restante.", math: `[OH⁻] = 1e-14 / ${h.toExponential(4)} = ${oh.toExponential(4)} M` });
        } else {
          oh = x;
          poh = -Math.log10(oh);
          ph = 14 - poh;
          h = Kw / oh;

          steps.push({ formula: "Kb = [HB⁺][OH⁻] / [B]", desc: "Fórmula cuadrática exacta (x² + Kb·x - Kb·C = 0) para encontrar [OH⁻].", math: `[OH⁻] = ${oh.toExponential(4)} M` });
          steps.push({ formula: "pOH = -log₁₀[OH⁻]", desc: "Cálculo del pOH a partir del ión hidroxilo.", math: `pOH = -log₁₀(${oh.toExponential(4)}) = ${poh.toFixed(4)}` });
          steps.push({ formula: "pH = 14 - pOH", desc: "Cálculo final del pH.", math: `pH = 14 - ${poh.toFixed(4)} = ${ph.toFixed(4)}` });
          steps.push({ formula: "[H⁺] = Kw / [OH⁻]", desc: "Concentración del ión hidrógeno restante.", math: `[H⁺] = 1e-14 / ${oh.toExponential(4)} = ${h.toExponential(4)} M` });
        }
      }
    }

    setResults({ ph, poh, h, oh, status: getPhStatus(ph), steps });
  };

  const handleReset = () => {
    setInputC('');
    setInputK('');
    setInputPh('');
    setResults(null);
  };

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    handleReset();
  };

  // 5. Asignamos la interfaz a la constante
  const TAB_CONTENT: Record<TabType, TabConfig> = {
    'ACIDO_FUERTE': {
      title: 'Ácido Fuerte',
      subtitle: 'Disociación completa — HCl, HNO₃, H₂SO₄, HBr, HI, HClO₄',
      formulas: ['[H⁺] = C', 'pH = -log₁₀[H⁺]', 'pOH = 14 - pH', '[OH⁻] = Kw / [H⁺]'],
      hasC: true, hasK: false, hasPh: false
    },
    'BASE_FUERTE': {
      title: 'Base Fuerte',
      subtitle: 'Disociación completa — NaOH, KOH, LiOH, Ca(OH)₂, Ba(OH)₂',
      formulas: ['[OH⁻] = C', 'pOH = -log₁₀[OH⁻]', 'pH = 14 - pOH', '[H⁺] = Kw / [OH⁻]'],
      hasC: true, hasK: false, hasPh: false
    },
    'ACIDO_DEBIL': {
      title: 'Ácido Débil',
      subtitle: 'Disociación parcial (Requiere Ka) — CH₃COOH, HF, HCN, HNO₂',
      formulas: ['Ka = [H⁺][A⁻]/[HA]', 'pH = -log₁₀[H⁺]', 'pOH = 14 - pH', '[OH⁻] = Kw / [H⁺]'],
      hasC: true, hasK: true, kLabel: 'Ka', hasPh: false
    },
    'BASE_DEBIL': {
      title: 'Base Débil',
      subtitle: 'Disociación parcial (Requiere Kb) — NH₃, CH₃NH₂, C₅H₅N',
      formulas: ['Kb = [HB⁺][OH⁻]/[B]', 'pOH = -log₁₀[OH⁻]', 'pH = 14 - pOH', '[H⁺] = Kw / [OH⁻]'],
      hasC: true, hasK: true, kLabel: 'Kb', hasPh: false
    },
    'LIBRE': {
      title: 'Calculadora Libre',
      subtitle: 'Ingresa un valor de pH y QuimiCalc deducirá el resto de variables.',
      formulas: ['[H⁺] = 10^(-pH)', '[OH⁻] = 10^(-pOH)', 'pH + pOH = 14', 'Kw = [H⁺][OH⁻]'],
      hasC: false, hasK: false, hasPh: true
    }
  };

  const currentConfig = TAB_CONTENT[activeTab];

  return (
    <div className="main-container">
      <header>
        <div className="logo-container">
          <span className="logo">QuimiCalc</span>
          <span className="subtitle">Calculadora de pH y equilibrio</span>
        </div>
      </header>

      <div className="content-area">
        
        {/* COLUMNA IZQUIERDA (Cálculos) */}
        <section className="calculation-area">
          <div className="welcome-box">
            <h2 className="welcome-title">Bienvenido a QuimiCalc</h2>
            <p className="welcome-text">
              Selecciona el tipo de calculo que necesitas, ingresa tus datos y obten resultados con explicaciones paso a paso. Ideal para estudiantes, profesores y entusiastas de la quimica.
            </p>
          </div>

          <nav className="tabs-nav">
            {(Object.keys(TAB_CONTENT) as TabType[]).map((tab) => (
              <button 
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => changeTab(tab)}
              >
                {TAB_CONTENT[tab].title}
              </button>
            ))}
          </nav>

          <div className="acid-panel">
            <h2 className="acid-panel-title">{currentConfig.title}</h2>
            <p className="acid-panel-subtitle">{currentConfig.subtitle}</p>

            <div className="formulas-box">
              <h3 className="formulas-title">FÓRMULAS UTILIZADAS</h3>
              <div className="formula-grid">
                {currentConfig.formulas.map((f, i) => (
                  <div key={i} className="formula-card">{f}</div>
                ))}
              </div>
            </div>

            <div className="input-row">
              {currentConfig.hasC && (
                <div className="input-group">
                  <label className="input-label">
                    <span className="info-icon">ⓘ</span>
                    <span>Concentración (mol/L)</span>
                  </label>
                  <input 
                    type="number" step="any" className="acid-input" 
                    placeholder="Ej: 0.1" value={inputC}
                    onChange={(e) => setInputC(e.target.value)}
                  />
                </div>
              )}
              
              {currentConfig.hasK && (
                <div className="input-group">
                  <label className="input-label">
                    <span className="info-icon">ⓘ</span>
                    <span>Constante {currentConfig.kLabel}</span>
                  </label>
                  <input 
                    type="number" step="any" className="acid-input" 
                    placeholder="Ej: 1.8e-5" value={inputK}
                    onChange={(e) => setInputK(e.target.value)}
                  />
                </div>
              )}

              {currentConfig.hasPh && (
                <div className="input-group">
                  <label className="input-label">
                    <span className="info-icon">ⓘ</span>
                    <span>Nivel de pH (0 a 14)</span>
                  </label>
                  <input 
                    type="number" step="any" className="acid-input" 
                    placeholder="Ej: 7.4" value={inputPh}
                    onChange={(e) => setInputPh(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="calculate-button" onClick={handleCalculate}>Calcular</button>
              <button className="reset-button" aria-label="Reiniciar" onClick={handleReset}>
                <span className="reset-icon">↺</span>
              </button>
            </div>

            {/* RESULTADOS */}
            {results && (
              <div className="results-container">
                <div className="ph-scale-section">
                  <div className="scale-header">
                    <span className="scale-title">ESCALA DE PH</span>
                    <span style={{ color: results.status.color }}>{results.status.text}</span>
                  </div>
                  
                  <div className="gradient-bar-wrapper">
                    <div className="gradient-bar"></div>
                    <div 
                      className="scale-indicator" 
                      style={{ left: `${Math.max(0, Math.min(100, (results.ph / 14) * 100))}%` }}
                    ></div>
                    <div 
                      className="scale-tag"
                      style={{ left: `${Math.max(0, Math.min(100, (results.ph / 14) * 100))}%` }}
                    >
                      pH {results.ph.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="scale-footer"><span>0</span><span>14</span></div>
                  <div className="scale-labels">
                    <span style={{color: 'var(--res-orange)'}}>← Ácido</span>
                    <span style={{color: 'var(--res-green)'}}>Neutro</span>
                    <span style={{color: 'var(--blue-accent)'}}>Base →</span>
                  </div>
                </div>

                <div className="results-grid">
                  <div className="result-card">
                    <div className="card-top"><span>PH</span> <span>⚗️</span></div>
                    <div className="card-value text-orange">{results.ph.toFixed(4)}</div>
                  </div>
                  <div className="result-card">
                    <div className="card-top"><span>POH</span> <span>🧪</span></div>
                    <div className="card-value text-cyan">{results.poh.toFixed(4)}</div>
                  </div>
                  <div className="result-card">
                    <div className="card-top"><span>[H⁺]</span> <span>💧</span></div>
                    <div className="card-value text-yellow">{results.h.toFixed(4)}</div>
                    <div className="card-unit">mol/L</div>
                  </div>
                  <div className="result-card">
                    <div className="card-top"><span>[OH⁻]</span> <span>🔄</span></div>
                    <div className="card-value text-green">{results.oh.toExponential(4)}</div>
                    <div className="card-unit">mol/L</div>
                  </div>
                </div>

                <div className="step-by-step-box">
                  <div className="step-header">
                    <span>📖 Paso a paso — ¿Cómo se calculó?</span><span>^</span>
                  </div>
                  <div className="timeline">
                    {results.steps.map((step, idx) => (
                      <div className="step-item" key={idx}>
                        <div className="step-num">{idx + 1}</div>
                        <div className="step-formula">{step.formula}</div>
                        <p className="step-desc">{step.desc}</p>
                        <p className="step-math">→ {step.math}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COLUMNA DERECHA (Aside) */}
        <aside className="aside-area">
          <div className="concepts-box">
            <h3 className="aside-title">Conceptos clave</h3>
            <div className="concept-card">
              <h4 className="concept-title">Que es el pH?</h4>
              <p className="concept-text">El pH mide que tan acida o basica es una solucion. Va de 0 (muy acido) a 14 (muy basico). El agua pura tiene pH 7 (neutro).</p>
            </div>
            <div className="concept-card">
              <h4 className="concept-title">Que son H+ y OH-?</h4>
              <p className="concept-text">H+ (protones) son iones de hidrogeno que hacen acida una solucion. OH- (hidroxilo) son iones que hacen basica una solucion.</p>
            </div>
            <div className="concept-card">
              <h4 className="concept-title">Acido fuerte vs. debil</h4>
              <p className="concept-text">Un acido fuerte se disocia completamente en agua. Un acido debil solo se disocia parcialmente formando un equilibrio.</p>
            </div>
          </div>

          <div className="substances-box">
            <h3 className="aside-title">Sustancias comunes</h3>
            <table className="substances-table">
              <thead>
                <tr><th>SUSTANCIA</th><th>TIPO</th><th>VALOR</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ácido clorhídrico <br/><span className="table-formula">[HCl]</span></td>
                  <td>Ácido fuerte</td>
                  <td className="text-purple">Disociación completa</td>
                </tr>
                <tr>
                  <td>Ácido sulfúrico <br/><span className="table-formula">[H₂SO₄]</span></td>
                  <td>Ácido fuerte</td>
                  <td className="text-purple">Disociación completa</td>
                </tr>
                <tr>
                  <td>Ácido nítrico <br/><span className="table-formula">[HNO₃]</span></td>
                  <td>Ácido fuerte</td>
                  <td className="text-purple">Disociación completa</td>
                </tr>
                <tr>
                  <td>Ácido acético <br/><span className="table-formula">[CH₃COOH]</span></td>
                  <td>Ácido débil</td>
                  <td className="text-purple">Ka = 1.8 × 10⁻⁵</td>
                </tr>
                <tr>
                  <td>Ácido fórmico <br/><span className="table-formula">[HCOOH]</span></td>
                  <td>Ácido débil</td>
                  <td className="text-purple">Ka = 1.8 × 10⁻⁴</td>
                </tr>
                <tr>
                  <td>Hidróxido de sodio <br/><span className="table-formula">[NaOH]</span></td>
                  <td>Base fuerte</td>
                  <td className="text-purple">Disociación completa</td>
                </tr>
                <tr>
                  <td>Hidróxido de potasio <br/><span className="table-formula">[KOH]</span></td>
                  <td>Base fuerte</td>
                  <td className="text-purple">Disociación completa</td>
                </tr>
                <tr>
                  <td>Amoníaco <br/><span className="table-formula">[NH₃]</span></td>
                  <td>Base débil</td>
                  <td className="text-purple">Kb = 1.8 × 10⁻⁵</td>
                </tr>
                <tr>
                  <td>Piridina <br/><span className="table-formula">[C₅H₅N]</span></td>
                  <td>Base débil</td>
                  <td className="text-purple">Kb = 1.7 × 10⁻⁹</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NUEVA SECCIÓN: Fórmulas clave */}
          <div className="formulas-list-box">
            <h3 className="aside-title">Fórmulas clave</h3>
            <div className="formula-list-item">pH = -log₁₀[H⁺]</div>
            <div className="formula-list-item">pOH = -log₁₀[OH⁻]</div>
            <div className="formula-list-item">pH + pOH = 14 (a 25°C)</div>
            <div className="formula-list-item">[H⁺] × [OH⁻] = Kw = 1 × 10⁻¹⁴</div>
            <div className="formula-list-item">Ka = [H⁺][A⁻] / [HA]</div>
            <div className="formula-list-item">Kb = [BH⁺][OH⁻] / [B]</div>
          </div>
        </aside>

      </div>
    </div>
  );
}