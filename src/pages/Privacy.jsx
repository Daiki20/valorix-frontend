import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Logo from '../components/Logo'

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>

        <div className="card" style={{ padding: '48px 48px' }}>
          <div style={{ marginBottom: 36 }}>
            <div className="badge" style={{ marginBottom: 16 }}>Юридический документ</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
              Политика конфиденциальности
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              Последнее обновление: 17 мая 2026 г.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, color: '#374151', fontSize: 15, lineHeight: 1.8 }}>

            <section>
              <h2 style={h2}>1. Оператор персональных данных</h2>
              <p>
                Сервис <strong>Valorix AI</strong> принадлежит и управляется физическим лицом,
                применяющим специальный налоговый режим «Налог на профессиональный доход»
                (самозанятый):
              </p>
              <div style={infoBox}>
                <div><strong>ФИО:</strong> Пищев Андрей Сергеевич</div>
                <div><strong>ИНН:</strong> 470805349664</div>
                <div><strong>Контакт:</strong> <a href="https://t.me/andrusha_pv" style={linkStyle}>@andrusha_pv</a> в Telegram</div>
              </div>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>2. Какие данные мы собираем</h2>
              <p>При регистрации и использовании сервиса мы собираем следующие персональные данные:</p>
              <ul style={ul}>
                <li><strong>Email-адрес</strong> — для идентификации аккаунта и входа в систему</li>
                <li><strong>Имя пользователя (никнейм)</strong> — для отображения в интерфейсе</li>
                <li><strong>Данные о транзакциях</strong> — история пополнений и трат монет</li>
                <li><strong>История запросов</strong> — матчи, на которые запрашивался анализ</li>
              </ul>
              <p>
                Мы <strong>не собираем</strong> номера телефонов, паспортные данные, геолокацию
                и иные чувствительные категории персональных данных.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>3. Цели обработки данных</h2>
              <p>Ваши данные используются исключительно для:</p>
              <ul style={ul}>
                <li>Предоставления доступа к сервису и его функциям</li>
                <li>Обработки платежей и зачисления монет на аккаунт</li>
                <li>Хранения истории анализов</li>
                <li>Технической поддержки пользователей</li>
                <li>Предотвращения мошенничества и злоупотреблений</li>
              </ul>
              <p>
                Мы <strong>не продаём</strong> и не передаём ваши данные третьим лицам в
                коммерческих целях.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>4. Передача данных третьим лицам</h2>
              <p>Для работы сервиса мы взаимодействуем со следующими сервисами:</p>
              <ul style={ul}>
                <li>
                  <strong>ЮКасса (YooKassa)</strong> — платёжная система для обработки оплат.
                  При оплате вы переходите на защищённую страницу ЮКассы; мы не получаем
                  и не храним данные вашей карты.
                </li>
                <li>
                  <strong>OpenAI / провайдер AI-анализа</strong> — запросы на анализ матчей
                  передаются AI-сервису без привязки к вашей личности.
                </li>
              </ul>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>5. Хранение и защита данных</h2>
              <p>
                Данные хранятся на защищённом сервере. Пароли хранятся исключительно
                в хешированном виде (bcrypt) и не могут быть восстановлены в исходном виде.
                Передача данных между браузером и сервером осуществляется по протоколу HTTPS.
              </p>
              <p>
                Мы храним данные в течение всего времени существования аккаунта.
                При удалении аккаунта данные удаляются в течение 30 дней.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>6. Права пользователей</h2>
              <p>В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» вы вправе:</p>
              <ul style={ul}>
                <li>Получить информацию об обработке ваших персональных данных</li>
                <li>Потребовать исправления неточных данных</li>
                <li>Потребовать удаления своих данных</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
              <p>
                Для реализации любого из этих прав обратитесь в поддержку через{' '}
                <a href="https://t.me/andrusha_pv" style={linkStyle}>Telegram @andrusha_pv</a>.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>7. Согласие на обработку данных</h2>
              <p>
                Регистрируясь на сайте, вы подтверждаете, что ознакомлены с настоящей
                Политикой конфиденциальности и даёте согласие на обработку ваших
                персональных данных в указанных целях.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>8. Изменения в политике</h2>
              <p>
                Мы вправе обновлять данную Политику. Актуальная версия всегда доступна
                на этой странице. Продолжение использования сервиса после изменений
                означает согласие с новой редакцией.
              </p>
            </section>

            <div style={divider} />

            <section>
              <h2 style={h2}>9. Контакты</h2>
              <p>
                По вопросам, связанным с обработкой персональных данных, обращайтесь:
              </p>
              <div style={infoBox}>
                <div>Telegram: <a href="https://t.me/andrusha_pv" style={linkStyle}>@andrusha_pv</a></div>
              </div>
            </section>

          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Вернуться на главную
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1a1a2e', color: '#94a3b8', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }} />
        <p style={{ fontSize: 12 }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664</p>
      </footer>
    </div>
  )
}

const h2 = { fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }
const divider = { height: 1, background: '#f1f5f9' }
const ul = { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }
const linkStyle = { color: '#2563eb', textDecoration: 'none', fontWeight: 600 }
const infoBox = {
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
  padding: '14px 18px', marginTop: 12, fontSize: 14,
  display: 'flex', flexDirection: 'column', gap: 6,
}
