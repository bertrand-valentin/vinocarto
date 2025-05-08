package com.bva.vinocarto_core.model;

public class CountryDto {

    private Long id;
    private String name;
    private String countryIsoCode;

    public CountryDto(Long id, String name, String countryIsoCode) {
        this.id = id;
        this.name = name;
        this.countryIsoCode = countryIsoCode;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountryIsoCode() {
        return countryIsoCode;
    }

    public void setCountryIsoCode(String countryIsoCode) {
        this.countryIsoCode = countryIsoCode;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Country{");
        sb.append("id=").append(id);
        sb.append(", name='").append(name).append('\'');
        sb.append(", countryIsoCode='").append(countryIsoCode).append('\'');
        sb.append('}');
        return sb.toString();
    }
}
