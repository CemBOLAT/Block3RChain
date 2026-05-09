from typing import TypedDict


CountryName = str
Alliance = list[CountryName]


class CountryData(TypedDict):
    troop_count: int


class HistoricalCountryData(CountryData):
    previous_alliances: Alliance


class PrintableCountryData(CountryData, total=False):
    previous_alliances: Alliance
