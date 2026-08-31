# AquaLux Dataset Sources and Online References

## AI-Assisted Vehicle Wash Center Management System

This document explains the data used in the AquaLux project and the online sources I used to support the system design. The project does not use a downloaded customer training dataset. I created sample records for development and testing, and the system stores new records in SQLite when it is used.

The current AI part is mainly rule-based. It gives package recommendations and a vehicle-care score using the values entered by the user. The demand feature uses previous AquaLux booking records to identify busy days. Therefore, I do not claim that the current system uses a fully trained machine-learning model.

## 1. Data Used in the Project

The main project database is `data/aqualux.db`. The `data` folder also contains JSON files used as sample project records.

| Data | Main Details | Purpose |
|---|---|---|
| Customers | Name, phone, email, city/address | Customer management |
| Vehicles | Vehicle number, type, owner | Vehicle management |
| Packages | Package name, vehicle type, price, duration | Booking and payment |
| Bookings | Customer, vehicle, package, date, time, status | Booking management and demand checking |
| Payments | Booking, amount, discount, method, status | Payments and receipts |
| AI Requests | Vehicle type and care inputs | AI recommendation history |
| AI Feedback | Helpful/not helpful and comments | Future AI evaluation |

The first records were created as demo data so I could develop and test the system before real business data was available. These records should be treated as project-created or synthetic data, not real customer records.

## 2. Online Sources Used

I did not copy these websites directly into the AquaLux database. I used them only to understand realistic vehicle categories, wash services and booking information.

### Department of Motor Traffic Sri Lanka

The Department of Motor Traffic provides official Sri Lankan vehicle statistics. It includes different vehicle classes such as motor cars, motorcycles and dual-purpose vehicles. This supported my decision to include different vehicle types in AquaLux instead of making the system only for cars.

Reference:  
https://dmt.gov.lk/index.php?Itemid=132&id=16&lang=en&option=com_content&view=article

Vehicle population statistics:  
https://www.dmt.gov.lk/images/PDF/statistics/TOTAL_VEHICLE_POPULATION_2010-2022.pdf

### Auto Miraj Sri Lanka

Auto Miraj provides vehicle wash, grooming and appointment services. Their website shows that vehicle-care businesses in Sri Lanka already use online service and appointment methods. This helped me when planning the booking and wash-package parts of AquaLux.

References:  
https://automiraj.lk/services-best-car-wash-services/  
https://automiraj.lk/contact-us/

### LAUGFS Car Care

LAUGFS Car Care provides different vehicle wash packages. Their detailed wash information includes body washing, interior cleaning, dashboard cleaning, tyre dressing and vacuuming. This supported the idea of using different wash levels and an interior-cleaning option in AquaLux.

Reference:  
https://www.laugfscarcare.lk/car-wash

### U.S. Environmental Protection Agency

I used the EPA source only as general background about responsible vehicle washing and reducing polluted runoff. It was not used to create AquaLux prices, customer records or AI scores.

Reference:  
https://www.epa.gov/nutrientpollution/what-you-can-do-your-home

## 3. How the Current AI Uses Data

The AquaLux AI advisor uses simple inputs such as vehicle type, dirt level, interior-cleaning need, special condition, days since the previous wash, vehicle usage, budget and preferred date.

The system calculates a 0-100 care score using fixed rules. This score is used only to support the wash recommendation. It is not a mechanical vehicle diagnosis.

For demand estimation, the system checks previous AquaLux bookings stored in SQLite. It groups bookings by weekday and uses the existing records to estimate whether a selected day may be quiet, moderate, busy or peak. The result can improve when more real bookings are stored in the system.

## 4. Demo Data and Real Data

There are three types of data connected to this project:

**Demo data** - sample customers, vehicles, bookings and payments created for development and testing.

**Operational data** - new records saved when users actually use the AquaLux system.

**Online references** - websites used to support the project design and vehicle-wash context. These sources are not direct customer datasets.

This difference is important because I do not want to present sample project data as if it came from a real company.

## 5. Training Dataset Status

At the current stage, AquaLux does not contain a separately downloaded machine-learning training dataset.

The system currently uses:

1. Rule-based vehicle-care scoring.
2. Rule-based package recommendations.
3. Historical AquaLux bookings for demand estimation.
4. Customer helpful/not-helpful feedback for future evaluation.

The admin AI page also does not show a made-up accuracy percentage. A proper accuracy value should only be reported after enough labelled data is collected and the model is tested correctly.

## 6. Future Machine-Learning Dataset

If more real AquaLux data is collected later, I can create a proper dataset and use it for machine learning. The data should be separated into training and testing parts so that the model can be checked using unseen records.

The scikit-learn documentation explains that a model should be evaluated properly instead of only checking how well it fits the training data.

References:  
https://scikit-learn.org/stable/getting_started.html  
https://scikit-learn.org/stable/model_selection.html  
https://scikit-learn.org/stable/api/sklearn.metrics.html

If a CSV file is created later, pandas can be used to load and clean the data before analysis or modelling.

Reference:  
https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html

## 7. Current Data Limitations

The current project data has some limitations:

- Demo records are not a full sample of Sri Lankan vehicle-wash customers.
- The number of historical bookings is still limited.
- Demand results can change when more bookings are added.
- Customer-entered data may contain mistakes.
- Helpful/not-helpful feedback is based on user opinion.
- AquaLux vehicle categories are project categories and are not exactly the same as all official DMT classifications.

Because of these limitations, I describe the current AI as a simple explainable support feature rather than a high-accuracy trained prediction model.

## 8. References

1. Department of Motor Traffic Sri Lanka (2026) *Statistics*. Available at: https://dmt.gov.lk/index.php?Itemid=132&id=16&lang=en&option=com_content&view=article (Accessed: 31 August 2026).
2. Department of Motor Traffic Sri Lanka, *Total Vehicle Population 2010-2022*. Available at: https://www.dmt.gov.lk/images/PDF/statistics/TOTAL_VEHICLE_POPULATION_2010-2022.pdf (Accessed: 31 August 2026).
3. Auto Miraj, *Best Car Wash Services*. Available at: https://automiraj.lk/services-best-car-wash-services/ (Accessed: 31 August 2026).
4. Auto Miraj, *Contact Us / Appointment Form*. Available at: https://automiraj.lk/contact-us/ (Accessed: 31 August 2026).
5. LAUGFS Car Care, *Vehicle Wash Packages*. Available at: https://www.laugfscarcare.lk/car-wash (Accessed: 31 August 2026).
6. U.S. Environmental Protection Agency, *Washing Your Car*. Available at: https://www.epa.gov/nutrientpollution/what-you-can-do-your-home (Accessed: 31 August 2026).
7. National Institute of Standards and Technology, *Synthetic Data Generation*. Available at: https://csrc.nist.gov/glossary/term/synthetic_data_generation (Accessed: 31 August 2026).
8. scikit-learn, *Getting Started*. Available at: https://scikit-learn.org/stable/getting_started.html (Accessed: 31 August 2026).
9. scikit-learn, *Model Selection and Evaluation*. Available at: https://scikit-learn.org/stable/model_selection.html (Accessed: 31 August 2026).
10. scikit-learn, *Metrics and Scoring*. Available at: https://scikit-learn.org/stable/api/sklearn.metrics.html (Accessed: 31 August 2026).
11. pandas, *pandas.read_csv*. Available at: https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html (Accessed: 31 August 2026).

## 9. Short Viva Explanation

I did not download a hidden training dataset and use it as my own. I created sample data to develop and test the AquaLux system. The system then stores its own customers, vehicles, bookings, payments and AI feedback in SQLite. The current AI uses simple rules for recommendation and previous booking records for demand estimation. If enough real labelled data is collected later, I can build and test a machine-learning model separately.
