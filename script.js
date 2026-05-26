document.addEventListener("DOMContentLoaded", function () {
    const caseContent = document.getElementById("caseContent");
    const buttons = document.querySelectorAll(".case-btn");

    function factorial(n) {
        let result = 1;

        for (let i = 2; i <= n; i++) {
            result *= i;
        }

        return result;
    }

    function combinations(n, k) {
        if (k < 0 || k > n) {
            return 0;
        }

        return factorial(n) / (factorial(k) * factorial(n - k));
    }

    function poisson(lambda, k) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    }

    function format(value, digits = 4) {
        return Number(value).toFixed(digits);
    }

    function renderPoissonChart(lambda, threshold) {
        let bars = "";

        for (let k = 0; k <= 8; k++) {
            const p = poisson(lambda, k);
            const x = 80 + k * 72;
            const height = Math.min(p * 900, 230);
            const y = 300 - height;
            const className = k > threshold ? "bar-danger" : "bar-normal";

            bars += `
                <rect class="${className}" x="${x}" y="${y}" width="42" height="${height}"></rect>
                <text class="label" x="${x + 14}" y="322">${k}</text>
                <text class="label" x="${x - 2}" y="${y - 8}">${p.toFixed(2)}</text>
            `;
        }

        return `
            <svg class="chart" viewBox="0 0 760 360">
                <text class="chart-title" x="205" y="28">Пуассон / аномалія мережевого трафіку</text>

                <line class="axis" x1="60" y1="300" x2="700" y2="300"></line>
                <line class="axis" x1="60" y1="60" x2="60" y2="300"></line>

                <line class="grid-line" x1="60" y1="240" x2="700" y2="240"></line>
                <line class="grid-line" x1="60" y1="180" x2="700" y2="180"></line>
                <line class="grid-line" x1="60" y1="120" x2="700" y2="120"></line>

                ${bars}

                <text class="axis-label" x="330" y="345">запити за інтервал</text>
                <text class="axis-label" x="18" y="55">P(k)</text>
                <text class="label" x="380" y="55">Червона зона: k > ${threshold}</text>
            </svg>
        `;
    }

    function abTestingChart() {
        return `
            <svg class="chart" viewBox="0 0 760 360">
                <text class="chart-title" x="250" y="28">A/B тестування: очікуваний діапазон</text>

                <line class="axis" x1="70" y1="300" x2="700" y2="300"></line>
                <line class="axis" x1="70" y1="55" x2="70" y2="300"></line>

                <path class="area" d="
                    M 230 300
                    C 280 190, 330 100, 380 85
                    C 430 100, 480 190, 530 300
                    Z
                "></path>

                <path class="curve" d="
                    M 100 300
                    C 180 300, 220 250, 260 190
                    C 310 100, 350 80, 380 78
                    C 410 80, 450 100, 500 190
                    C 540 250, 580 300, 660 300
                "></path>

                <circle class="dot" cx="540" cy="245" r="8"></circle>

                <line class="grid-line" x1="230" y1="300" x2="230" y2="90"></line>
                <line class="grid-line" x1="530" y1="300" x2="530" y2="90"></line>

                <text class="label" x="225" y="318">нижня межа</text>
                <text class="label" x="505" y="318">верхня межа</text>
                <text class="label" x="548" y="245">поточний результат</text>
                <text class="label" x="285" y="120">очікувана зона</text>
            </svg>
        `;
    }

    function renderCdfChart(values, limit) {
        if (!values || values.length === 0) {
            return `
                <div class="panel">
                    Немає даних для побудови графіка.
                </div>
            `;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const min = Math.min(...sorted);
        const max = Math.max(...sorted);
        const range = max - min || 1;

        const chartLeft = 80;
        const chartRight = 700;
        const chartTop = 60;
        const chartBottom = 300;
        const chartWidth = chartRight - chartLeft;
        const chartHeight = chartBottom - chartTop;

        function scaleX(value) {
            return chartLeft + ((value - min) / range) * chartWidth;
        }

        function scaleY(value) {
            return chartBottom - value * chartHeight;
        }

        let steps = "";
        let points = "";

        let previousX = chartLeft;
        let previousY = chartBottom;

        sorted.forEach((value, index) => {
            const currentX = scaleX(value);
            const currentY = scaleY((index + 1) / sorted.length);

            steps += `
                <line x1="${previousX}" y1="${previousY}" x2="${currentX}" y2="${previousY}"
                      stroke="#16a34a" stroke-width="4" stroke-linecap="round"></line>
                <line x1="${currentX}" y1="${previousY}" x2="${currentX}" y2="${currentY}"
                      stroke="#bbf7d0" stroke-width="2" stroke-dasharray="5 5"></line>
                <line x1="${currentX}" y1="${currentY}" x2="${currentX + 30}" y2="${currentY}"
                      stroke="#16a34a" stroke-width="4" stroke-linecap="round"></line>
            `;

            points += `
                <circle cx="${currentX}" cy="${currentY}" r="5"
                        fill="#16a34a" stroke="#ffffff" stroke-width="2"></circle>
            `;

            previousX = currentX + 30;
            previousY = currentY;
        });

        steps += `
            <line x1="${previousX}" y1="${previousY}" x2="${chartRight}" y2="${previousY}"
                  stroke="#16a34a" stroke-width="4" stroke-linecap="round"></line>
        `;

        const countBelowLimit = values.filter(value => value < limit).length;
        const cdfValue = countBelowLimit / values.length;

        let limitX = scaleX(limit);
        if (limitX < chartLeft) {
            limitX = chartLeft;
        }
        if (limitX > chartRight) {
            limitX = chartRight;
        }

        const limitY = scaleY(cdfValue);

        return `
            <svg class="chart" viewBox="0 0 760 360" width="760" height="360">
                <rect x="0" y="0" width="760" height="360" fill="#ffffff"></rect>

                <text x="220" y="30" font-size="18" font-weight="700" fill="#111827">
                    CDF продуктивності: час завантаження сторінки
                </text>

                <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}"
                      stroke="#111827" stroke-width="2"></line>
                <line x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${chartBottom}"
                      stroke="#111827" stroke-width="2"></line>

                <line x1="${chartLeft}" y1="${scaleY(0.25)}" x2="${chartRight}" y2="${scaleY(0.25)}"
                      stroke="#e5e7eb" stroke-width="1"></line>
                <line x1="${chartLeft}" y1="${scaleY(0.50)}" x2="${chartRight}" y2="${scaleY(0.50)}"
                      stroke="#e5e7eb" stroke-width="1"></line>
                <line x1="${chartLeft}" y1="${scaleY(0.75)}" x2="${chartRight}" y2="${scaleY(0.75)}"
                      stroke="#e5e7eb" stroke-width="1"></line>
                <line x1="${chartLeft}" y1="${scaleY(1.00)}" x2="${chartRight}" y2="${scaleY(1.00)}"
                      stroke="#e5e7eb" stroke-width="1"></line>

                <text x="42" y="${scaleY(0) + 5}" font-size="13" fill="#374151">0</text>
                <text x="28" y="${scaleY(0.25) + 5}" font-size="13" fill="#374151">0.25</text>
                <text x="28" y="${scaleY(0.50) + 5}" font-size="13" fill="#374151">0.50</text>
                <text x="28" y="${scaleY(0.75) + 5}" font-size="13" fill="#374151">0.75</text>
                <text x="42" y="${scaleY(1) + 5}" font-size="13" fill="#374151">1</text>

                <text x="${chartLeft}" y="325" font-size="13" fill="#374151">${min}</text>
                <text x="${chartRight - 20}" y="325" font-size="13" fill="#374151">${max}</text>

                ${steps}
                ${points}

                <line x1="${limitX}" y1="${chartBottom}" x2="${limitX}" y2="${limitY}"
                      stroke="#ef4444" stroke-width="2" stroke-dasharray="5 5"></line>

                <circle cx="${limitX}" cy="${limitY}" r="7"
                        fill="#ef4444" stroke="#ffffff" stroke-width="2"></circle>

                <text x="${Math.min(limitX + 10, chartRight - 150)}" y="${Math.max(limitY - 10, chartTop + 20)}"
                      font-size="14" fill="#111827" font-weight="700">
                    F*(${limit}) = ${format(cdfValue, 2)}
                </text>

                <text x="290" y="345" font-size="15" font-weight="700" fill="#111827">
                    час завантаження сторінки, секунди
                </text>

                <text x="18" y="50" font-size="15" font-weight="700" fill="#111827">
                    F*(x)
                </text>
            </svg>
        `;
    }

    function showCase(caseName) {
        if (caseName === "qa") {
            renderQA();
        }

        if (caseName === "sla") {
            renderSLA();
        }

        if (caseName === "load") {
            renderLoad();
        }

        if (caseName === "bayes") {
            renderBayes();
        }

        if (caseName === "poisson") {
            renderPoisson();
        }

        if (caseName === "ab") {
            renderAB();
        }

        if (caseName === "cdf") {
            renderCDF();
        }

        buttons.forEach(function (button) {
            if (button.dataset.case === caseName) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }

    function renderQA(n = 10, k = 3) {
        const result = combinations(n, k);

        caseContent.innerHTML = `
            <h2>Матриця QA-тестування — комбінаторика</h2>

            <div class="badges">
                <span class="badge">Завдання 1</span>
                <span class="badge">Завдання 5</span>
                <span class="badge">Завдання 7</span>
                <span class="badge">C(n,k)</span>
            </div>

            <p>
                Приклад: QA-команда вибирає k компонентів із n доступних
                для інтеграційного тестування.
            </p>

            <div class="input-row">
                <div class="input-group">
                    <label>Кількість компонентів n</label>
                    <input id="qaN" type="number" value="${n}" min="1">
                </div>

                <div class="input-group">
                    <label>Скільки обираємо k</label>
                    <input id="qaK" type="number" value="${k}" min="1">
                </div>

                <button class="calc-btn" id="qaCalc">Перерахувати</button>
            </div>

            <div class="grid-2">
                <div class="panel">
                    <h3>Формула</h3>
                    <div class="formula">C(${n}, ${k}) = ${result}</div>
                    <div class="output-box">
                        Кількість тестових сценаріїв: ${result}
                    </div>
                </div>

                <div class="panel">
                    <h3>Тест-матриця</h3>
                    <table class="matrix">
                        <tr>
                            <th>Сценарій</th>
                            <th>Компонент 1</th>
                            <th>Компонент 2</th>
                            <th>Компонент 3</th>
                        </tr>
                        <tr><td>1</td><td>Авторизація</td><td>Бронювання</td><td>Оплата</td></tr>
                        <tr><td>2</td><td>Авторизація</td><td>Кімнати</td><td>Звіти</td></tr>
                        <tr><td>3</td><td>Бронювання</td><td>Оплата</td><td>Сповіщення</td></tr>
                        <tr><td>...</td><td colspan="3">усього ${result} варіантів</td></tr>
                    </table>
                </div>
            </div>
        `;

        document.getElementById("qaCalc").addEventListener("click", function () {
            const newN = Number(document.getElementById("qaN").value);
            const newK = Number(document.getElementById("qaK").value);
            renderQA(newN, newK);
        });
    }

    function renderSLA(pA = 0.99, pB = 0.95) {
        const sequential = pA * pB;
        const parallel = 1 - (1 - pA) * (1 - pB);

        caseContent.innerHTML = `
            <h2>SLA / надійність — перетин і об’єднання подій</h2>

            <div class="badges">
                <span class="badge">Завдання 2</span>
                <span class="badge">Завдання 8</span>
                <span class="badge">A ∩ B</span>
                <span class="badge">A ∪ B</span>
            </div>

            <p>Введи SLA двох серверів і порівняй послідовну та резервну архітектуру.</p>

            <div class="input-row">
                <div class="input-group">
                    <label>SLA сервера A</label>
                    <input id="slaA" type="number" step="0.01" value="${pA}">
                </div>

                <div class="input-group">
                    <label>SLA сервера B</label>
                    <input id="slaB" type="number" step="0.01" value="${pB}">
                </div>

                <button class="calc-btn" id="slaCalc">Перерахувати</button>
            </div>

            <div class="server-diagram">
                <div class="server">Сервер A<br>${pA}</div>
                <div class="arrow">→</div>
                <div class="server">Сервер B<br>${pB}</div>
            </div>

            <div class="grid-2">
                <div class="panel">
                    <h3>Послідовна система</h3>
                    <div class="formula">P = ${pA} · ${pB}</div>
                    <div class="output-box">SLA = ${format(sequential, 4)}</div>
                </div>

                <div class="panel">
                    <h3>Паралельний кластер</h3>
                    <div class="formula">P = 1 - (1-${pA})(1-${pB})</div>
                    <div class="output-box">SLA = ${format(parallel, 4)}</div>
                </div>
            </div>
        `;

        document.getElementById("slaCalc").addEventListener("click", function () {
            const newA = Number(document.getElementById("slaA").value);
            const newB = Number(document.getElementById("slaB").value);
            renderSLA(newA, newB);
        });
    }

    function renderLoad(total = 4, canary = 1) {
        const probability = total > 0 ? canary / total : 0;

        caseContent.innerHTML = `
            <h2>Балансування навантаження — простір подій і класична ймовірність</h2>

            <div class="badges">
                <span class="badge">Завдання 3</span>
                <span class="badge">Завдання 4</span>
                <span class="badge">Завдання 6</span>
                <span class="badge">P(A)=m/n</span>
            </div>

            <p>Введи кількість серверів і кількість тестових canary-серверів.</p>

            <div class="input-row">
                <div class="input-group">
                    <label>Усього серверів</label>
                    <input id="loadTotal" type="number" value="${total}" min="1">
                </div>

                <div class="input-group">
                    <label>Canary-серверів</label>
                    <input id="loadCanary" type="number" value="${canary}" min="0">
                </div>

                <button class="calc-btn" id="loadCalc">Перерахувати</button>
            </div>

            <div class="formula">P(canary) = ${canary} / ${total}</div>

            <div class="output-box">
                Ймовірність потрапити на canary-реліз: ${format(probability, 4)}
            </div>
        `;

        document.getElementById("loadCalc").addEventListener("click", function () {
            const newTotal = Number(document.getElementById("loadTotal").value);
            const newCanary = Number(document.getElementById("loadCanary").value);
            renderLoad(newTotal, newCanary);
        });
    }

    function renderBayes(front = 0.10, back = 0.70, mobile = 0.20, fDef = 0.09, bDef = 0.08, mDef = 0.07) {
        const totalDefect = front * fDef + back * bDef + mobile * mDef;
        const backendPosterior = totalDefect > 0 ? (back * bDef) / totalDefect : 0;

        caseContent.innerHTML = `
            <h2>Інциденти Байєса — маршрутизація проблем</h2>

            <div class="badges">
                <span class="badge">Завдання 10</span>
                <span class="badge">Завдання 11</span>
                <span class="badge">Формула Байєса</span>
            </div>

            <p>Введи частки трафіку та ймовірності дефекту для команд.</p>

            <div class="input-row">
                <div class="input-group">
                    <label>Частка фронтенду</label>
                    <input id="front" type="number" step="0.01" value="${front}">
                </div>

                <div class="input-group">
                    <label>Частка бекенду</label>
                    <input id="back" type="number" step="0.01" value="${back}">
                </div>

                <div class="input-group">
                    <label>Частка мобільного застосунку</label>
                    <input id="mobile" type="number" step="0.01" value="${mobile}">
                </div>

                <div class="input-group">
                    <label>Дефекти фронтенду</label>
                    <input id="fDef" type="number" step="0.01" value="${fDef}">
                </div>

                <div class="input-group">
                    <label>Дефекти бекенду</label>
                    <input id="bDef" type="number" step="0.01" value="${bDef}">
                </div>

                <div class="input-group">
                    <label>Дефекти мобільного застосунку</label>
                    <input id="mDef" type="number" step="0.01" value="${mDef}">
                </div>

                <button class="calc-btn" id="bayesCalc">Перерахувати</button>
            </div>

            <div class="microservices">
                <div class="service low">
                    <strong>Фронтенд</strong><br>
                    частка ${front}<br>
                    дефекти ${fDef}
                </div>

                <div class="service high">
                    <strong>Бекенд</strong><br>
                    частка ${back}<br>
                    дефекти ${bDef}
                </div>

                <div class="service medium">
                    <strong>Мобільний застосунок</strong><br>
                    частка ${mobile}<br>
                    дефекти ${mDef}
                </div>
            </div>

            <div class="formula">P(D)=Σ P(Hᵢ)P(D|Hᵢ) = ${format(totalDefect, 4)}</div>
            <div class="formula">P(Бекенд|D)=частка бекенду · дефекти бекенду / P(D)</div>

            <div class="output-box">
                Ймовірність, що причина у бекенді: ${format(backendPosterior, 4)}
            </div>
        `;

        document.getElementById("bayesCalc").addEventListener("click", function () {
            renderBayes(
                Number(document.getElementById("front").value),
                Number(document.getElementById("back").value),
                Number(document.getElementById("mobile").value),
                Number(document.getElementById("fDef").value),
                Number(document.getElementById("bDef").value),
                Number(document.getElementById("mDef").value)
            );
        });
    }

    function renderPoisson(lambda = 2, threshold = 3) {
        let cumulative = 0;

        for (let k = 0; k <= threshold; k++) {
            cumulative += poisson(lambda, k);
        }

        const moreThan = 1 - cumulative;

        caseContent.innerHTML = `
            <h2>Пуассон / DDoS — потік рідкісних подій</h2>

            <div class="badges">
                <span class="badge">Завдання 15</span>
                <span class="badge">Закон Пуассона</span>
                <span class="badge">DDoS-захист</span>
            </div>

            <p>Введи λ та межу, після якої трафік вважається підозрілим.</p>

            <div class="input-row">
                <div class="input-group">
                    <label>λ</label>
                    <input id="lambda" type="number" step="0.1" value="${lambda}">
                </div>

                <div class="input-group">
                    <label>Поріг</label>
                    <input id="threshold" type="number" value="${threshold}">
                </div>

                <button class="calc-btn" id="poissonCalc">Перерахувати</button>
            </div>

            ${renderPoissonChart(lambda, threshold)}

            <div class="formula">P(X > ${threshold}) = ${format(moreThan, 4)}</div>

            <div class="output-box warning">
                Ймовірність аномального трафіку: ${format(moreThan, 4)}
            </div>
        `;

        document.getElementById("poissonCalc").addEventListener("click", function () {
            const newLambda = Number(document.getElementById("lambda").value);
            const newThreshold = Number(document.getElementById("threshold").value);
            renderPoisson(newLambda, newThreshold);
        });
    }

    function renderAB(n = 400, p = 0.2, observed = 100) {
        const q = 1 - p;
        const mean = n * p;
        const sigma = Math.sqrt(n * p * q);
        const z = sigma > 0 ? (observed - mean) / sigma : 0;

        caseContent.innerHTML = `
            <h2>A/B тестування — нормальне наближення і Z-score</h2>

            <div class="badges">
                <span class="badge">Завдання 13</span>
                <span class="badge">Завдання 14</span>
                <span class="badge">Муавр–Лаплас</span>
            </div>

            <p>Введи параметри A/B тесту.</p>

            <div class="input-row">
                <div class="input-group">
                    <label>Кількість користувачів n</label>
                    <input id="abN" type="number" value="${n}">
                </div>

                <div class="input-group">
                    <label>Очікувана ймовірність p</label>
                    <input id="abP" type="number" step="0.01" value="${p}">
                </div>

                <div class="input-group">
                    <label>Фактичні кліки k</label>
                    <input id="abK" type="number" value="${observed}">
                </div>

                <button class="calc-btn" id="abCalc">Перерахувати</button>
            </div>

            ${abTestingChart()}

            <div class="formula">z = (k - np) / √npq</div>
            <div class="output-box">Z-score = ${format(z, 4)}</div>
        `;

        document.getElementById("abCalc").addEventListener("click", function () {
            renderAB(
                Number(document.getElementById("abN").value),
                Number(document.getElementById("abP").value),
                Number(document.getElementById("abK").value)
            );
        });
    }

    function renderCDF(valuesText = "1.1,1.3,1.8,2.0,2.1,2.3,2.4,2.5,2.8,3.0,3.1,3.4,3.7,4.0,4.5", limit = 2.5) {
        const values = valuesText
            .split(",")
            .map(value => Number(value.trim()))
            .filter(value => !Number.isNaN(value));

        const countBelowLimit = values.filter(value => value < limit).length;
        const cdf = values.length > 0 ? countBelowLimit / values.length : 0;

        caseContent.innerHTML = `
            <h2>Продуктивність / CDF — аналіз швидкодії системи</h2>

            <div class="badges">
                <span class="badge">Завдання 17</span>
                <span class="badge">Завдання 18</span>
                <span class="badge">Завдання 19</span>
                <span class="badge">Завдання 20</span>
                <span class="badge">CDF</span>
            </div>

            <p>Введи часи завантаження сторінки через кому та межу для F*(x).</p>

            <div class="input-row">
                <div class="input-group">
                    <label>Часи завантаження</label>
                    <textarea id="cdfValues">${valuesText}</textarea>
                </div>

                <div class="input-group">
                    <label>Межа x</label>
                    <input id="cdfLimit" type="number" step="0.1" value="${limit}">
                </div>

                <button class="calc-btn" id="cdfCalc">Перерахувати</button>
            </div>

            ${renderCdfChart(values, limit)}

            <div class="formula">F*(${limit}) = ${countBelowLimit} / ${values.length}</div>

            <div class="output-box">
                Частка користувачів, у яких сторінка завантажилась швидше ${limit} сек: ${format(cdf, 4)}
            </div>
        `;

        document.getElementById("cdfCalc").addEventListener("click", function () {
            renderCDF(
                document.getElementById("cdfValues").value,
                Number(document.getElementById("cdfLimit").value)
            );
        });
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            showCase(button.dataset.case);
        });
    });

    showCase("qa");
});