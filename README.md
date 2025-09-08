# Finance Dashboard

A customizable, real-time finance monitoring dashboard built with Next.js, featuring drag-and-drop widgets, multiple financial APIs integration, and comprehensive data visualization.

![Finance Dashboard](https://via.placeholder.com/800x400?text=Finance+Dashboard+Screenshot)

## 🚀 Features

### Core Functionality
- **Widget Management System**: Add, remove, and rearrange widgets with drag-and-drop functionality
- **Real-time Data**: Live financial data from multiple APIs with intelligent caching
- **Responsive Design**: Fully responsive layout supporting all screen sizes
- **Data Persistence**: Dashboard configurations saved to localStorage with export/import functionality

### Widget Types

#### 📊 Table Widget
- Paginated stock data with search and filtering
- Sortable columns (symbol, price, change, volume)
- Customizable items per page
- Real-time price updates

#### 💳 Finance Cards
- **Watchlist**: Track your favorite stocks
- **Market Gainers**: Top performing stocks
- **Performance Data**: Stock performance metrics
- **Financial Data**: Detailed financial information
- Summary cards with aggregate statistics

#### 📈 Chart Widget
- Interactive line, bar, and area charts
- Multiple timeframes (1D, 5D, 1M, 3M, 1Y)
- Real-time price movements
- Customizable chart types and indicators

### Advanced Features
- **Theme Switching**: Seamless light/dark mode toggle
- **API Integration**: Support for Alpha Vantage, Finnhub, and other financial APIs
- **Rate Limiting**: Intelligent API request management
- **Error Handling**: Comprehensive error states and retry mechanisms
- **Loading States**: Smooth loading animations and skeleton screens

## 🛠 Technology Stack

- **Frontend Framework**: Next.js 14 with JavaScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand for global state
- **Data Visualization**: Recharts for interactive charts
- **Layout System**: React Grid Layout for drag-and-drop functionality
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key
   NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query
   NEXT_PUBLIC_FINNHUB_BASE_URL=https://finnhub.io/api/v1
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Keys Setup

### Alpha Vantage
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Get your free API key
3. Add it to your `.env.local` file

### Finnhub
1. Visit [Finnhub](https://finnhub.io/)
2. Create a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

## 🎯 Usage

### Adding Widgets
1. Click the "Add Widget" button in the header
2. Choose from Table, Finance Card, or Chart widgets
3. Configure the widget settings
4. The widget will be added to your dashboard

### Customizing Layout
- **Drag**: Click and drag widget headers to move them
- **Resize**: Drag the resize handle in the bottom-right corner
- **Remove**: Click the X button on any widget

### Configuring Widgets
- **Table Widget**: Set stock symbols, pagination options
- **Finance Cards**: Choose card type, display limit, summary options
- **Chart Widget**: Select symbol, chart type, timeframe

### Dashboard Management
- **Export**: Save your dashboard configuration as JSON
- **Import**: Load a previously saved dashboard
- **Clear**: Remove all widgets (with confirmation)
- **Theme**: Toggle between light and dark modes

## 🏗 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.js          # Main header with controls
│   │   ├── Layout.js          # App layout wrapper
│   │   └── DashboardGrid.js   # Grid layout with drag-and-drop
│   ├── modals/
│   │   └── AddWidgetModal.js  # Widget creation modal
│   └── widgets/
│       ├── BaseWidget.js      # Base widget component
│       ├── WidgetRenderer.js  # Widget type router
│       ├── TableWidget.js     # Stock table widget
│       ├── FinanceCardWidget.js # Finance cards widget
│       └── ChartWidget.js     # Chart visualization widget
├── pages/
│   ├── _app.js               # Next.js app wrapper
│   ├── _document.js          # HTML document structure
│   └── index.js              # Main dashboard page
├── services/
│   └── apiService.js         # API integration service
├── stores/
│   ├── dashboardStore.js     # Dashboard state management
│   └── apiStore.js           # API configuration store
└── styles/
    └── globals.css           # Global styles and Tailwind
```

## 🔧 Configuration

### Widget Configuration
Each widget type supports various configuration options:

```javascript
// Table Widget
{
  symbols: ['AAPL', 'GOOGL', 'MSFT'],
  itemsPerPage: 10
}

// Finance Card Widget
{
  cardType: 'watchlist', // 'watchlist', 'market_gainers', 'performance', 'financial_data'
  symbols: ['AAPL', 'GOOGL'],
  displayLimit: 5,
  showSummary: true
}

// Chart Widget
{
  symbol: 'AAPL',
  chartType: 'line', // 'line', 'bar', 'candlestick'
  timeframe: '1D',
  showVolume: false
}
```

### API Rate Limiting
The application includes built-in rate limiting:
- **Alpha Vantage**: 5 requests per minute
- **Finnhub**: 60 requests per minute
- Automatic request queuing and retry logic

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- Heroku

## 🎨 Customization

### Adding New Widget Types
1. Create a new widget component in `src/components/widgets/`
2. Add the widget type to `dashboardStore.js`
3. Update `WidgetRenderer.js` to include the new type
4. Add configuration options to `AddWidgetModal.js`

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `globals.css` for custom components
- Use Tailwind utility classes throughout the application

## 🐛 Troubleshooting

### Common Issues

**API Keys Not Working**
- Ensure environment variables are correctly set
- Check API key validity and rate limits
- Verify the API endpoints are accessible

**Widgets Not Loading**
- Check browser console for errors
- Verify internet connection
- Ensure API keys have sufficient quota

**Layout Issues**
- Clear browser cache and localStorage
- Check for JavaScript errors
- Verify responsive breakpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Alpha Vantage](https://www.alphavantage.co/) for financial data API
- [Finnhub](https://finnhub.io/) for market data
- [Recharts](https://recharts.org/) for data visualization
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for state management

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using Next.js and modern web technologies**

