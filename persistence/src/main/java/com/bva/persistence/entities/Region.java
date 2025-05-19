package com.bva.persistence.entities;

import com.bva.vinocarto_core.model.RegionDto;
import jakarta.persistence.*;

@Entity
public class Region {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Long id;
    private String name;
    @ManyToOne
    @JoinColumn(name = "country_id_fk")
    private Country country;

    public Region(Long id, String name, Country country) {
        this.id = id;
        this.name = name;
        this.country = country;
    }

    public Region() {

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

    public Country getCountry() {
        return country;
    }

    public void setCountry(Country country) {
        this.country = country;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Region{");
        sb.append("id=").append(id);
        sb.append(", name='").append(name).append('\'');
        sb.append(", country=").append(country);
        sb.append('}');
        return sb.toString();
    }

    public RegionDto toDto() {
        return new RegionDto(id, name, country.getName());
    }

    public static Region fromDto(RegionDto dto) {
        Country country = new Country();
        country.setName(dto.getCountryName());
        return new Region(dto.getId(), dto.getName(), country);
    }
}
