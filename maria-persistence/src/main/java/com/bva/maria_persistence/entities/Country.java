package com.bva.maria_persistence.entities;

import com.bva.vinocarto_core.model.CountryDto;
import jakarta.persistence.*;

@Entity
public class Country {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Long id;
    private String name;
    @Column(name = "ISO_CODE")
    private String countryIsoCode;

    public Country(Long id, String name, String countryIsoCode) {
        this.id = id;
        this.name = name;
        this.countryIsoCode = countryIsoCode;
    }

    public Country() {

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

    public CountryDto toDto() {
        return new CountryDto(id, name, countryIsoCode);
    }
    public static Country fromDto(CountryDto dto) {
        return new Country(dto.getId(), dto.getName(), dto.getCountryIsoCode());
    }
}
