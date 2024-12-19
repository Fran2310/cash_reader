import pandas as pd

#Filtrar solo USD
df = pd.read_csv("backend/src/data/banknote_net.csv")

df_usd = df[df["Currency"] == "USD"]

df_usd = df_usd.reset_index(drop=True)
df_usd = df_usd.drop(columns=['Unnamed: 0'])

df_usd.to_csv('backend/src/data/dataset_usd.csv')

#EXPLORACION DATA
denomination_counts = df_usd['Denomination'].value_counts().reset_index()

denomination_counts.columns = ['Denomination', 'Count']

denomination_counts[['Value', 'Suffix']] = denomination_counts['Denomination'].str.split('_', expand=True)

# Convertir a números
denomination_counts['Value'] = denomination_counts['Value'].astype(int)
denomination_counts['Suffix'] = denomination_counts['Suffix'].astype(int)

# Ordenar primero por 'Value' y luego por 'Suffix'
denomination_counts = denomination_counts.sort_values(by=['Value', 'Suffix'], ascending=False)

# Reconstruir serie ordenada
sorted_denomination = denomination_counts.set_index('Denomination')['Count']



print(df_usd.columns)
print(len(df_usd))
print(df_usd.head())
print(sorted_denomination)