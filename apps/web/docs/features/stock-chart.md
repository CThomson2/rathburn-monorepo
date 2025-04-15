# Stock Chart

What frontend libraries would you recommend for designing a large time series interactive graph, which uses PostgreSQL data to create line graphs over a variety of user-specified time periods?

## Requirements

- The dataset is for inventory data - specifically, stock quantity over a three year period, categorised by material type.
- I want to allow for the timeframe on the x axis to be reduced (either using a smooth click and drag function similar to stock trading charts, or simpler checkbox style time period selection).
- At smaller timeframe (1 month, 1 week) the graph should show more detail. For instance, it could appear as a smooth "spline" when the chart axis timeframe is a year or greater. But when zooming in and reducing visible timeframe, the chart could become more precise and show individual data points.

[UI inspiration](~/Desktop/Screenshot 20250406 at 22.18.50.png)
[Annotated Search Bar](~/Desktop/Saturday 5th at 18.35.06.png)

I want to take a lot of inspiration from the website TradingView, specifically the dashboard page shown in the image. My web app has nothing to do with stock trading, but a similar design could work equally well for my purposes.

The dataset is for inventory data - specifically, stock quantity over a three year period, categorised by material type. I want to allow for the timeframe on the x axis to be reduced (either using a smooth click and drag function similar to stock trading charts, or simpler checkbox style time period selection).

At smaller timeframe (1 month, 1 week) the graph should show more detail. For instance, it could appear as a smooth "spline" when the chart axis timeframe is a year or greater. But when zooming in and reducing visible timeframe, the chart could become more precise and show individual data points.

I mentioned the categorisation of data. There are multiple ways of categorising or filtering it as the SQL table has numerous columns.

- by date range (which is handled by the adjustable time axis)

- by type of stock (two different types exist: raw material and reprocessed material, stored under drum_type SQL field)

- by individual material type (hexane, methanol etc.)

- by supplier (company who supplied any given unit of stock recorded as a row in sql table)

So how could this large flexibility in filtering and view customisation work well in a NextJS app frond end chart-based page ?

The data I want to display will be from my Supabase project, tables:

Table stock_history:

columns date for time-axis

material_code for each individual material identifier and to separate them to sum their quantitative data across the time period

change field (each record has a value for the number of stock units involved in the event: positive for new drums arriving in stock, negative for drums leaving inventory to be processed)

And related SQL views you should consider implementing into the plan for developing this stock data graph page:

vw_stock_history_analysis - (joins multiple tables together for fully comprehensive information flow for each inventory event)

vw_order_history - a full historical record log of raw material orders placed at our company

vw_supplier_analysis - tabulated information on suppliers to be used for comparisons, decision-making on supplier selection, reducing the numerical stats into a simple 5 star rating to rank suppliers, find outliers in terms of different operational factors, etc. This would not be graphed, but displayed as table data or similar.

---

Could you give me some guidance in what tools to use, as well as more detailed principles and techniques of the frameworks and technologies which I should use? For instance, on the latter point, advice on data fetching for UI display (SSR, when to use server actions vs. client side APIs, whether to write SQL pre-written SELECT functions in Supabase and call them when requested, or to move some more logic to NextJS and allow some flexibility in building the query), and other relevant guidance, please.
